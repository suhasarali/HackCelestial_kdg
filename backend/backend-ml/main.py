import sys
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

# --- SETUP APP ---
app = FastAPI(title="Fish AI Master Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Fish AI Backend is Live! 🚀"}

# --- MOUNT FISH IDENTIFIER (Existing) ---
try:
    # Assuming backend-ml/fish_identifier/main.py exists
    sys.path.append(os.path.join(os.path.dirname(__file__), "fish_identifier"))
    from fish_identifier.main import app as fish_id_app
    app.mount("/fish-id", fish_id_app)
    print("✅ Fish Identifier mounted at /fish-id")
except Exception as e:
    print(f"⚠️ Fish Identifier mount failed: {e}")

# --- CONNECT CODE-A-THON (New Endpoint) ---
try:
    # 1. Add folder to path (Make sure folder is named 'code_a_thon')
    sys.path.append(os.path.join(os.path.dirname(__file__), "code_a_thon"))
    
    # 2. Import your updated script
    import test_single_image

    @app.post("/custom-model/predict")
    async def predict_custom(file: UploadFile = File(...)):
        """
        Receives an image file -> Sends to test_single_image.py -> Returns JSON
        """
        return test_single_image.predict_fish_from_image(file)

    print("✅ Code-a-thon Logic connected at /custom-model/predict")

except Exception as e:
    print(f"⚠️ Code-a-thon import failed: {e}")