import tensorflow as tf
import numpy as np
from PIL import Image
import json

# -------------------------
# Load model and labels
# -------------------------
model = tf.keras.models.load_model("model/fish_classifier.h5")

with open("model/class_indices.json") as f:
    class_indices = json.load(f)

# reverse mapping: index -> class name
labels = {v: k for k, v in class_indices.items()}

# -------------------------
# Load and preprocess image
# -------------------------
img_path = "image.png"  

img = Image.open(img_path).convert("RGB")
img = img.resize((224, 224))
img_array = np.array(img)
img_array = np.expand_dims(img_array, axis=0)

# -------------------------
# Predict
# -------------------------
preds = model.predict(img_array)
predicted_index = np.argmax(preds)
confidence = float(np.max(preds))

predicted_class = labels[predicted_index]

print("Predicted fish:", predicted_class)
print("Confidence:", round(confidence * 100, 2), "%")
