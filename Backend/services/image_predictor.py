import os
import base64
from io import BytesIO
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
from torchvision import transforms
from services.ml_predictor import ARTIFACTS_DIR

# 1. Setup PyTorch Device & Constants
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMAGE_SIZE = 128
CLASS_NAMES = ['Cyst', 'Normal', 'Stone', 'Tumor']

# 2. Define the Model Blueprint
class KidneyDiseaseModel(nn.Module):
    def __init__(self, num_classes=4):
        super(KidneyDiseaseModel, self).__init__()
        self.backbone = models.efficientnet_b0(
            weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1
        )
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)

# 3. Global Variables & Model Loading
image_model = None

try:
    model_path = os.path.join(ARTIFACTS_DIR, 'kidney_disease.pth')
    if os.path.exists(model_path):
        image_model = KidneyDiseaseModel(num_classes=len(CLASS_NAMES)).to(device)
        state_dict = torch.load(model_path, map_location=device)
        image_model.load_state_dict(state_dict)
        image_model.eval() 
        print("👁️ PyTorch Visual AI Initialized (EfficientNet with Grad-CAM)!")
    else:
        print("⚠️ Image model file not found in ml_artifacts.")
except Exception as e:
    print(f"⚠️ Failed to load PyTorch Model: {e}")

# 4. Grad-CAM Logic
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.gradients = None
        self.activations = None
        target_layer.register_forward_hook(self.forward_hook)
        target_layer.register_full_backward_hook(self.backward_hook)

    def forward_hook(self, module, input, output):
        self.activations = output

    def backward_hook(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate(self, input_tensor, class_idx):
        self.model.zero_grad()
        output = self.model(input_tensor)
        loss = output[:, class_idx]
        loss.backward()

        gradients = self.gradients
        activations = self.activations

        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * activations, dim=1).squeeze()

        cam = F.relu(cam)
        cam = cam.detach().cpu().numpy()

        cam = cv2.resize(cam, (IMAGE_SIZE, IMAGE_SIZE))
        cam = (cam - cam.min()) / (cam.max() + 1e-8)

        return cam

# 5. The Main Analysis Function
transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor()
])

def analyze_medical_scan(image_file):
    """
    Takes an uploaded image, runs inference, generates a Grad-CAM heatmap,
    and returns a base64 encoded image to the frontend.
    """
    if image_model is None:
        return {"error": "Visual AI is offline", "risk": 0}

    try:
        # Open image and ensure RGB
        img = Image.open(image_file).convert('RGB')
        img_tensor = transform(img).unsqueeze(0).to(device)

        # Target layer for Grad-CAM (EfficientNet B0 specific)
        target_layer = image_model.backbone.features[-1]
        gradcam = GradCAM(image_model, target_layer)

        # Predict
        # We temporarily turn on gradient tracking for Grad-CAM
        with torch.set_grad_enabled(True): 
            outputs = image_model(img_tensor)
            probs = F.softmax(outputs, dim=1)
            conf, predicted = torch.max(probs, 1)

        predicted_idx = predicted.item()
        predicted_class = CLASS_NAMES[predicted_idx]
        confidence_score = conf.item() * 100

        # Calculate Risk Score
        normal_prob = probs[0][1].item()
        abnormal_risk = (1.0 - normal_prob) * 100

        # Generate Grad-CAM Heatmap
        cam = gradcam.generate(img_tensor, predicted_idx)

        # Overlay Heatmap on original image
        img_np = np.array(img.resize((IMAGE_SIZE, IMAGE_SIZE)))
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        
        # Convert BGR (OpenCV) to RGB
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)

        # Convert overlay to Base64 String for React
        overlay_pil = Image.fromarray(overlay)
        buffered = BytesIO()
        overlay_pil.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        base64_image = f"data:image/png;base64,{img_str}"

        return {
            "status": "success",
            "risk": round(abnormal_risk, 1), 
            "finding": f"{predicted_class} Detected" if predicted_class != 'Normal' else "Scan Appears Normal",
            "confidence": round(confidence_score, 1),
            "predicted_class": predicted_class,
            "heatmap_image": base64_image  # NEW: Send the image back!
        }

    except Exception as e: 
        import traceback
        print(f"Image Processing Error: {traceback.format_exc()}")
        return {"error": str(e), "risk": 0}