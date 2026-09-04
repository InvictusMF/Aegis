# Aegis Scientific Research Foundation

**Document:** Research Foundations, Methodologies & Ethics  
**System:** Aegis Examination Integrity Intelligence Platform

---

## 1. Academic Background & The Integrity Trilemma

Online assessment platforms face the "Proctoring Trilemma":
1. **Integrity:** Ensuring the credentials awarded reflect genuine unassisted mastery.
2. **Privacy:** Protecting student dignity against invasive 24/7 video surveillance.
3. **Fairness:** Avoiding false positives on neurodivergent candidates, physical movements, or technical glitches.

Traditional proctoring software relied on invasive 1-to-1 video streaming, automated black-box flags, and controversial emotion/gaze detection models. Academic literature (Coghlan et al., 2021; Selwyn et al., 2023) demonstrated that autonomous black-box flagging disproportionately penalizes candidates with disabilities and minorities while providing zero explainability.

Aegis was designed from the ground up to solve this trilemma through **multimodal temporal correlation, privacy-preserving client-side telemetry, and mandatory human review**.

---

## 2. Core Research Principles

### 2.1 Multimodal Temporal Correlation vs Isolated Signals
*Research Insight:* An isolated event (e.g. looking away for 3 seconds, or clicking out of a tab) has a high probability of innocence (e.g. sneezing, looking at scratch paper, operating system notification).  
*Aegis Implementation:* We designed the **Suspicious Episode Engine**, which requires temporal corroboration across independent domains before escalating concern:
$$\text{Suspicious Episode} = \text{TemporalCluster}(\Delta t \le 20s, \{\text{BrowserState}, \text{CameraOrientation}, \text{AnswerMutation}\})$$

### 2.2 Unsupervised Anomaly Detection (Isolation Forest)
*Research Insight:* Ground-truth cheating datasets in production examinations are notoriously sparse, biased, and noisy. Supervised classifiers trained on synthetic labels overfit and fail on novel external assistance techniques.  
*Aegis Implementation:* Aegis utilizes **Isolation Forest (Liu, Ting, Zhou, 2008)** for unsupervised anomaly detection. Anomalies are isolated closer to the root of randomized decision trees. The model outputs a statistical atypicality metric, not a moral or legal cheating verdict.

*Transparency Disclosure:* All initial prototype evaluations are conducted on clearly documented synthetic behavioral telemetry. We explicitly reject unvalidated real-world accuracy claims without longitudinal empirical trials.

### 2.3 Decoupling Risk from Evidence Confidence
*Research Insight:* A high-risk pattern with low signal certainty (e.g. an ambiguous blur event on a single monitor) requires different procedural treatment than a high-risk pattern corroborated by clipboard, tab, and visual tracking.  
*Aegis Implementation:* Aegis computes two orthogonal dimensions:
- **Risk Score (0–100):** Prioritization metric reflecting pattern severity and question difficulty context.
- **Evidence Confidence (Low / Moderate / High):** Epistemic certainty based on sensor diversity, temporal alignment, and presence of innocent alternative hypotheses.

### 2.4 Privacy-Preserving On-Device Computer Vision
*Research Insight:* Transmitting raw webcam footage across wide-area networks creates catastrophic privacy and surveillance risks (FERPA, GDPR).  
*Aegis Implementation:* Aegis executes MediaPipe FaceLandmarker WebAssembly models directly inside the candidate's browser sandbox. The server receives zero video frames. Only ephemeral, coarse presence and orientation signals (`FACE_DETECTED`, `FACE_MISSING`, `MULTIPLE_FACES`, `ATTENTION_DEVIATION`) are emitted.

### 2.5 Alternative Explanation Generation & Human-in-the-Loop
*Research Insight:* Cognitive bias in examiners causes confirmation bias when presented with "cheating suspicion" dashboards.  
*Aegis Implementation:* Gemini assistant is explicitly prompted to generate plausible innocent hypotheses (e.g. scratch paper use, OS popups, posture adjustment). Consequential decisions require written examiner rationale and cannot be executed autonomously by AI.

---

## 3. Selected Scholarly References

1. Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). *Isolation Forest*. Eighth IEEE International Conference on Data Mining, 413-422.
2. Coghlan, S., Miller, T., & Paterson, J. (2021). *Good proctor or "Big Brother"? Ethics of online exam surveillance technologies*. Philosophy & Technology, 34(4), 1581-1606.
3. Selwyn, N., O'Neill, C., Smith, G., Andrejevic, M., & Gu, X. (2023). *A necessary evil? The rise of online exam proctoring in Australian universities*. Higher Education Research & Development, 42(3), 698-712.
4. Fischer, M. J., Lynch, N. A., & Paterson, M. S. (1985). *Impossibility of distributed consensus with one faulty process*. Journal of the ACM (JACM), 32(2), 374-382.
