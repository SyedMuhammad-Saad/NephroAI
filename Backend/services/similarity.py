import os
import pickle
import pandas as pd
from services.ml_predictor import ARTIFACTS_DIR

# 1. Load the historical dataset so we can pull the actual patient profiles
try:
    csv_path = os.path.join(ARTIFACTS_DIR, 'training_sample.csv')
    history_df = pd.read_csv(csv_path)
    
    # We must drop blank rows to keep the row index numbers perfectly aligned 
    # with what the model learned!
    history_df = history_df.dropna().reset_index(drop=True) 
except Exception as e:
    print(f"⚠️ Similarity Engine failed to load history CSV: {e}")
    history_df = None

# 2. Load your friend's pre-trained Similarity Model
try:
    similarity_model_path = os.path.join(ARTIFACTS_DIR, 'similarity.pkl') # Change if name is different!
    with open(similarity_model_path, 'rb') as f:
        similarity_model = pickle.load(f)
    print("✅ Patient Similarity Engine Initialized!")
except Exception as e:
    print(f"⚠️ Similarity model failed to load. Error: {e}")
    similarity_model = None


def find_similar_patients(scaled_input, predicted_risk, top_k=3):
    """
    Finds the closest historical patients, but strictly filters them 
    so their actual diagnosis matches our AI's predicted diagnosis.
    """
    if similarity_model is None or history_df is None:
        return []

    try:
        # Determine if the current patient is predicted Sick or Healthy
        is_sick = predicted_risk >= 50
        desired_target = 1 if is_sick else 0

        # Ask the model for the top 15 closest patients (so we have room to filter)
        distances, indices = similarity_model.kneighbors(scaled_input, n_neighbors=15)
        
        similar_patients = []
        
        # Loop through the closest patients
        for idx in indices[0]:
            patient_row = history_df.iloc[idx]
            patient_target = int(patient_row['target'])
            
            # THE CLINICAL RULE: Only accept them if their historical diagnosis 
            # matches what our AI is predicting for the current patient!
            if patient_target == desired_target:
                similar_patients.append({
                    "Age": int(patient_row['Age']),
                    "GFR": round(float(patient_row['GFR']), 1),
                    "Creatinine": round(float(patient_row['Creatinine']), 1),
                    "Urea": round(float(patient_row['Urea']), 1),
                    "Outcome": "High Risk (CKD)" if patient_target == 1 else "Healthy"
                })
            
            # Stop once we have our 3 perfect matches
            if len(similar_patients) == top_k:
                break
                
        return similar_patients

    except Exception as e:
        print(f"Similarity Engine Error: {e}")
        return []