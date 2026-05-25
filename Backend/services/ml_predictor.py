import joblib
import numpy as np
import os

# This tells Python exactly where the ml_artifacts folder is located
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'ml_artifacts')

try:
    model = joblib.load(os.path.join(ARTIFACTS_DIR, 'ckd_ml.pkl'))
    scaler = joblib.load(os.path.join(ARTIFACTS_DIR, 'scaler.pkl'))
    print("✅ Predictive AI Model & Scaler loaded into the Brain!")
except Exception as e:
    print(f"❌ Error loading AI files: {e}")
    model = None
    scaler = None

def safe_float(value, fallback=0.0):
    try:
        if value is None or str(value).strip() == '':
            return fallback
        return float(value)
    except:
        return fallback

def predict_ckd_risk(input_data):
    """Takes the 21 features array, squishes it, and returns the risk score."""
    if model is None or scaler is None:
        raise ValueError("AI Engine is offline due to missing files.")
    
    scaled_input = scaler.transform(input_data)
    probabilities = model.predict_proba(scaled_input)
    ckd_probability = probabilities[0][1]
    return int(ckd_probability * 100)