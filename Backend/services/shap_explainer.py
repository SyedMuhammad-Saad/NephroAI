import shap
import numpy as np

# Import the ALREADY LOADED model from your main predictor
# This saves memory so Flask doesn't load the model twice!
from services.ml_predictor import model

# Initialize the Explainer once when the server starts
# We use try/except just in case the model hasn't loaded yet
try:
    if model is not None:
        explainer = shap.TreeExplainer(model)
        print("✅ SHAP Explainability Engine Initialized!")
    else:
        explainer = None
except Exception as e:
    print(f"⚠️ SHAP Engine failed to load: {e}")
    explainer = None

# We need the exact names of the 21 features so React can read them
FEATURE_NAMES = [
    "Sex", "Age", "Haemoglobin", "Hematocrit", "Lymphocytes",
    "MCH", "MCHC", "MCV", "Monocytes", "MPV", "PCT", "PDW",
    "PlateletCount", "Polymorphs", "RBCCount", "RDWSD",
    "WBCCount", "Eosinophils", "Creatinine", "Urea", "GFR"
]

def generate_shap_explanation(scaled_input):
    """
    Takes the scaled 21-feature array, calculates SHAP values, 
    and returns a sorted list of the top contributing factors.
    """
    if explainer is None:
        return {"error": "SHAP Engine is offline."}

    try:
        # 1. Run the explainer exactly like your Jupyter code: explainer(row)
        explanation_obj = explainer(scaled_input)
        
        # 2. Extract the exact 1D array using YOUR slicing method: [0, :, 1]
        # [1st patient, all 21 features, Class 1 (CKD)]
        shap_array = explanation_obj.values[0, :, 1]

        # 3. Map the mathematical impact to the feature names
        contributions = []
        for i in range(len(FEATURE_NAMES)):
            contributions.append({
                "feature": FEATURE_NAMES[i],
                "impact": float(shap_array[i]) # This is now guaranteed to be a single, flat number!
            })
            
        # 4. Sort them so the biggest impacts are at the top
        contributions.sort(key=lambda x: abs(x["impact"]), reverse=True)
        
        return contributions

    except Exception as e:
        print(f"SHAP Error: {e}")
        return {"error": str(e)}