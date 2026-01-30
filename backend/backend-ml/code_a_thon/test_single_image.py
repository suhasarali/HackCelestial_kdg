# import tensorflow as tf
# import numpy as np
# from PIL import Image
# import json

# # -------------------------
# # Load model and labels
# # -------------------------
# model = tf.keras.models.load_model("model/fish_classifier.h5")

# with open("model/class_indices.json") as f:
#     class_indices = json.load(f)

# # reverse mapping: index -> class name
# labels = {v: k for k, v in class_indices.items()}

# # -------------------------
# # Load and preprocess image
# # -------------------------
# img_path = "image.png"  

# img = Image.open(img_path).convert("RGB")
# img = img.resize((224, 224))
# img_array = np.array(img)
# img_array = np.expand_dims(img_array, axis=0)

# # -------------------------
# # Predict
# # -------------------------
# preds = model.predict(img_array)
# predicted_index = np.argmax(preds)
# confidence = float(np.max(preds))

# predicted_class = labels[predicted_index]

# print("Predicted fish:", predicted_class)
# print("Confidence:", round(confidence * 100, 2), "%")


import tensorflow as tf
import numpy as np
from PIL import Image
import json
import os

# --- 1. SETUP PATHS DYNAMICALLY ---
# Get the directory where THIS file (test_single_image.py) is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "fish_classifier.h5")
INDICES_PATH = os.path.join(BASE_DIR, "model", "class_indices.json")

# --- 2. LOAD MODEL (Global Load for Speed) ---
print(f"🔄 Loading model from: {MODEL_PATH}")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    with open(INDICES_PATH) as f:
        class_indices = json.load(f)
    # reverse mapping: index -> class name
    labels = {v: k for k, v in class_indices.items()}
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    labels = {}

# --- 3. PREDICTION FUNCTION ---
def predict_fish_from_image(image_file):
    """
    Accepts a PIL Image or file path, returns dictionary result.
    """
    if model is None:
        return {"error": "Model not loaded"}

    try:
        # Load Image
        if isinstance(image_file, str):
            img = Image.open(image_file).convert("RGB")
        else:
            img = Image.open(image_file.file).convert("RGB") # Handle FastAPI UploadFile

        # Preprocess
        img = img.resize((224, 224))
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        preds = model.predict(img_array)
        predicted_index = np.argmax(preds)
        confidence = float(np.max(preds))
        predicted_class = labels.get(predicted_index, "Unknown")

        return {
            "status": "success",
            "predicted_fish": predicted_class,
            "confidence_score": round(confidence * 100, 2)
        }
    
    except Exception as e:
        return {"status": "error", "message": str(e)}