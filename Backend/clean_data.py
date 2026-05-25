import pandas as pd
import os

# 1. Load the file the department gave you
df = pd.read_csv("CKD_dataset.csv")

# 2. Rename the columns to perfectly match our AI Engine
df = df.rename(columns={
    "Platelet Count": "PlateletCount",
    "RBC Count": "RBCCount",
    "RDW SD": "RDWSD",
    "WBC Count": "WBCCount",
    "GFR ": "GFR",
    "Target": "target"  # DiCE expects lowercase 'target'
})

# 3. Drop the 'Sr. No' column because it's just an ID
if "Sr. No" in df.columns:
    df = df.drop(columns=["Sr. No"])

# 4. Save it directly into your ml_artifacts folder!
output_path = os.path.join("ml_artifacts", "training_sample.csv")
df.to_csv(output_path, index=False)

print(f"✅ Cleaned training data saved successfully to {output_path}!")