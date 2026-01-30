from fastapi import APIRouter, File, UploadFile, HTTPException
import cloudinary
import cloudinary.uploader
import tempfile
import os
from google import genai
from google.genai import types
from app import config  # ✅ import config from app folder

router = APIRouter()

# ✅ Configure Cloudinary
cloudinary.config(
    cloud_name=config.CLOUDINARY_CLOUD_NAME,
    api_key=config.CLOUDINARY_API_KEY,
    api_secret=config.CLOUDINARY_API_SECRET
)

# ✅ Initialize Gemini client (Replacing Roboflow)
client = genai.Client(api_key=config.GEMINI_API_KEY)

@router.post("")
async def detect_route(image: UploadFile = File(...)):
    try:
        # 1️⃣ Save uploaded file temporarily
        # Read the bytes once so we can use them for Gemini and the temp file
        image_data = await image.read()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(image_data)
            tmp_path = tmp.name

        # 2️⃣ Send the data to Gemini (Replacing Roboflow workflow)
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
                "Identify this fish species.",
                "Provide the Common English name and the "
                "local name (e.g., Hindi or Marathi) if applicable. Nothing else."
                "Format: 'English Name (Local Name)'"
            ]
        )

        # 3️⃣ Upload to Cloudinary AFTER successful GenAI call
        upload_result = cloudinary.uploader.upload(tmp_path)
        image_url = upload_result.get("secure_url")

        # 4️⃣ Clean up temp file
        os.remove(tmp_path)

        # Extracting the text result to match your previous 'detected_species' logic
        detected_species = response.text.strip() if response.text else None

        return {
            "success": True,
            "roboflow_result": detected_species, # Kept key name same as per your request
        }

    except Exception as e:
        # Ensure cleanup if error occurs after file creation
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))