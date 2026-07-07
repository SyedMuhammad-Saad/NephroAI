# 🚀 NephroAI: Diagnostic Command Center for Chronic Kidney Disease

NephroAI is a full-stack, clinically viable platform engineered specifically for nephrologists to predict and analyze patient risk for Chronic Kidney Disease (CKD) in real-time. Moving beyond standard predictive modeling, this platform is designed as an enterprise-grade medical tool that prioritizes transparency, accuracy, and ease of use in clinical environments.

To ensure real-world applicability, the entire machine learning pipeline was trained and validated using authentic clinical data generously provided by the **Pakistan Kidney Center, Abbottabad**.

## 🌟 Key Novelties & Breakthroughs

Instead of settling for a standard "black box" AI model, NephroAI pushes the boundaries of clinical technology through several advanced integrations:

* **Dual-Modality Architecture:** The platform integrates two distinct predictive pipelines, simultaneously analyzing tabular clinical health data alongside medical imaging to generate a unified, highly accurate risk assessment.
* **Advanced Explainable AI (XAI):** Clinical trust is guaranteed by integrating advanced XAI techniques directly into the UI:
  * **SHAP Values:** Visually isolates exactly which clinical biomarkers are driving a patient's specific risk score.
  * **Counterfactual Analysis:** Calculates the exact physiological parameters that must change to lower a patient's risk category (What-If analysis).
  * **Similar Record Matching:** Instantly retrieves historically similar cases to aid in accurate case-based reasoning.
* **Domain-Specific Medical Chatbot:** A specialized LLM agent designed specifically for doctors without deep technical backgrounds. Medical staff can use simple, natural language to ask absolutely any question about a patient's diagnosis. They can seamlessly prompt the chatbot to pull up SHAP explanations, explore counterfactual scenarios, and compare similar cases completely friction-free.

## 💻 Tech Stack

* **Frontend:** React.js, Tailwind CSS
* **Backend:** Python, Flask (Modular Blueprint Architecture)
* **Machine Learning & AI:** PyTorch, Scikit-Learn, LLM Integration
* **Database & Security:** SQLite, Secure Hashed-Password Authentication

## 🤝 Acknowledgments

This platform was built as a Final Year Project (Class of 2026). Building an enterprise-grade system of this complexity was a massive team undertaking.

* **Data Partner:** A profound thanks to the Pakistan Kidney Center, Abbottabad, for providing the authentic clinical dataset that made this research possible.
