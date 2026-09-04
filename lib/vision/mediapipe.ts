"use client";

import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

export interface VisionSignal {
  type: "FACE_DETECTED" | "FACE_MISSING" | "MULTIPLE_FACES" | "ATTENTION_DEVIATION" | "CAMERA_INTERRUPTED";
  confidence: number;
  metadata: {
    facesCount: number;
    yaw?: number;
    pitch?: number;
    description: string;
  };
}

export class AegisVisionMonitor {
  private faceLandmarker: FaceLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private lastSignalTime: number = 0;
  private onSignalCallback: ((signal: VisionSignal) => void) | null = null;

  private consecutiveMissingCount = 0;
  private consecutiveDeviationCount = 0;

  public async initialize(
    videoEl: HTMLVideoElement,
    onSignal: (signal: VisionSignal) => void
  ): Promise<boolean> {
    this.videoElement = videoEl;
    this.onSignalCallback = onSignal;

    try {
      // 1. Request camera stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
        audio: false,
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // 2. Initialize MediaPipe Vision Tasks
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 3,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });

      return true;
    } catch (err) {
      console.warn("MediaPipe Vision initialization note:", err);
      // If WebGL/model fails or camera denied, report camera interruption
      this.onSignalCallback?.({
        type: "CAMERA_INTERRUPTED",
        confidence: 1.0,
        metadata: {
          facesCount: 0,
          description: "Camera feed unaccessible or permissions denied.",
        },
      });
      return false;
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.processLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
  }

  private processLoop = () => {
    if (!this.isRunning || !this.videoElement || !this.faceLandmarker) return;

    const now = performance.now();

    // Process frames at ~5Hz to conserve candidate client CPU/battery
    if (now - this.lastSignalTime > 200 && this.videoElement.readyState >= 2) {
      this.lastSignalTime = now;

      try {
        const results = this.faceLandmarker.detectForVideo(this.videoElement, now);
        const facesCount = results.faceLandmarks.length;

        if (facesCount === 0) {
          this.consecutiveMissingCount++;
          // Trigger after ~1.5s missing to avoid instantaneous false alerts from blinking
          if (this.consecutiveMissingCount === 8) {
            this.onSignalCallback?.({
              type: "FACE_MISSING",
              confidence: 0.92,
              metadata: {
                facesCount: 0,
                description: "No face detected in video frame for over 1.5 seconds.",
              },
            });
          }
        } else if (facesCount > 1) {
          this.consecutiveMissingCount = 0;
          this.onSignalCallback?.({
            type: "MULTIPLE_FACES",
            confidence: 0.9,
            metadata: {
              facesCount,
              description: `Detected ${facesCount} distinct faces within the frame.`,
            },
          });
        } else {
          this.consecutiveMissingCount = 0;

          // Estimate coarse head orientation from facial landmarks
          // Landmark 1: Nose tip, Landmark 33: Left eye inner, Landmark 263: Right eye inner
          const landmarks = results.faceLandmarks[0];
          const nose = landmarks[1];
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];

          if (nose && leftEye && rightEye) {
            const eyeMidX = (leftEye.x + rightEye.x) / 2;
            const eyeDist = Math.abs(rightEye.x - leftEye.x);
            const horizontalOffset = (nose.x - eyeMidX) / (eyeDist || 0.1);

            // If head yaw deviation exceeds normal frontal range (0.35)
            if (Math.abs(horizontalOffset) > 0.45) {
              this.consecutiveDeviationCount++;
              if (this.consecutiveDeviationCount === 6) {
                this.onSignalCallback?.({
                  type: "ATTENTION_DEVIATION",
                  confidence: 0.85,
                  metadata: {
                    facesCount: 1,
                    yaw: Number(horizontalOffset.toFixed(2)),
                    description: "Significant head rotation / gaze shift away from display.",
                  },
                });
              }
            } else {
              this.consecutiveDeviationCount = 0;
            }
          }
        }
      } catch (e) {
        // Safe swallow frame processing blip
      }
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop);
  };
}
