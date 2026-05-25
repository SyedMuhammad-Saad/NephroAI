import os
import pandas as pd
import dice_ml
import warnings
from sklearn.pipeline import Pipeline # NEW: We need the glue!
from services.ml_predictor import model, scaler, ARTIFACTS_DIR # NEW: Import the scaler!

FEATURE_NAMES = [
    "Sex", "Age", "Haemoglobin", "Hematocrit", "Lymphocytes",
    "MCH", "MCHC", "MCV", "Monocytes", "MPV", "PCT", "PDW",
    "PlateletCount", "Polymorphs", "RBCCount", "RDWSD",
    "WBCCount", "Eosinophils", "Creatinine", "Urea", "GFR"
]

TARGET_COL = 'target'

# NEW: The Ninja Wrapper! This strips the names off the dataframe 
# so Scikit-Learn can't complain about missing spaces.
class NameBypassPipeline:
    def __init__(self, scaler, model):
        self.scaler = scaler
        self.model = model
        # DiCE needs to know what classes exist (0 = Healthy, 1 = CKD)
        self.classes_ = getattr(model, 'classes_', [0, 1])
        
    def predict(self, X):
        # Convert DataFrame to raw numpy array
        raw_array = X.values if hasattr(X, 'columns') else X
        return self.model.predict(self.scaler.transform(raw_array))
        
    def predict_proba(self, X):
        raw_array = X.values if hasattr(X, 'columns') else X
        return self.model.predict_proba(self.scaler.transform(raw_array))


try:
    if model is not None and scaler is not None:
        csv_path = os.path.join(ARTIFACTS_DIR, 'training_sample.csv')
        train_dataset = pd.read_csv(csv_path)
# NEW: The NaN Fix! Instantly delete any rows with blank data
        train_dataset = train_dataset.dropna()
        for col in FEATURE_NAMES:
            if col in train_dataset.columns:
                train_dataset[col] = train_dataset[col].astype(float)

        d = dice_ml.Data(
            dataframe=train_dataset,
            continuous_features=FEATURE_NAMES,
            outcome_name=TARGET_COL
        )
        
        # Wrap our model and scaler in the bypass logic
        ai_pipeline = NameBypassPipeline(scaler, model)

        # Give DiCE the wrapped pipeline
        m = dice_ml.Model(model=ai_pipeline, backend="sklearn")

        exp = dice_ml.Dice(d, m, method="genetic")
        print("✅ DiCE Counterfactual Engine Initialized (With Name Bypass)!")
    else:
        exp = None
except Exception as e:
    print(f"⚠️ DiCE Engine failed to load: {e}")
    exp = None

def generate_counterfactual_plan(patient_dict, is_healthy):
    """
    If sick: Calculates exactly how to reverse the disease.
    If healthy: Calculates the 'tipping points' that would cause disease.
    """
    if exp is None:
        return {"error": "DiCE Engine is offline."}

    try:
        query_instance = pd.DataFrame([patient_dict])
        actionable_features = ['Haemoglobin', 'Hematocrit', 'Creatinine', 'Urea', 'GFR']

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            
            # The math is correct now, so it will solve instantly!
            dice_exp = exp.generate_counterfactuals(
                query_instance,
                total_CFs=1, 
                desired_class="opposite",
                features_to_vary="all",
                proximity_weight=0.2,
                diversity_weight=1.0
            )

        cf_df = dice_exp.cf_examples_list[0].final_cfs_df
        
        if cf_df is None or cf_df.empty:
            return [{"feature": "AI Alert", "action": "Could not simulate a realistic clinical pathway.", "current": "", "target": ""}]

        recommendations = []
        cf_row = cf_df.iloc[0]

        for feature in actionable_features:
            orig_val = float(query_instance.iloc[0][feature])
            new_val = float(cf_row[feature])
            
            if abs(orig_val - new_val) > 0.1:
                direction = "Decrease" if new_val < orig_val else "Increase"
                
                if is_healthy:
                    action_text = f"🚨 DANGER: CKD Risk if this {direction}s to {round(new_val, 2)}"
                else:
                    action_text = f"✅ TARGET: {direction} to {round(new_val, 2)}"

                recommendations.append({
                    "feature": feature,
                    "current": round(orig_val, 2),
                    "target": round(new_val, 2),
                    "action": action_text
                })

        return recommendations

    except Exception as e:
        print(f"DiCE Generation Error: {e}")
        return {"error": str(e)}