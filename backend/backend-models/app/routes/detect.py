from fastapi import APIRouter, File, UploadFile, HTTPException
import cloudinary
import cloudinary.uploader
import tempfile
from inference_sdk import InferenceHTTPClient
from app import config  # ✅ import config from app folder
import os

router = APIRouter()

# ✅ Configure Cloudinary
cloudinary.config(
    cloud_name=config.CLOUDINARY_CLOUD_NAME,
    api_key=config.CLOUDINARY_API_KEY,
    api_secret=config.CLOUDINARY_API_SECRET
)

# ✅ Initialize Roboflow client
client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=config.ROBOFLOW_API_KEY
)

@router.post("")
async def detect_route(image: UploadFile = File(...)):
    try:
        # 1️⃣ Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(await image.read())
            tmp_path = tmp.name

        # 2️⃣ Send the local file to Roboflow (not URL)
        result = client.run_workflow(
            workspace_name=config.ROBOFLOW_WORKSPACE,
            workflow_id=config.ROBOFLOW_WORKFLOW,
            images={"image": tmp_path},  # 👈 pass local path instead of URL
            use_cache=True
        )

        # 3️⃣ (Optional) Upload to Cloudinary AFTER successful Roboflow call
        upload_result = cloudinary.uploader.upload(tmp_path)
        image_url = upload_result.get("secure_url")

        # 4️⃣ Clean up temp file
        os.remove(tmp_path)

        detected_species = None
        # Check for the correct nested path based on the new output structure
        if result and isinstance(result, list) and result and "predictions" in result[0] and "predictions" in result[0]["predictions"]:
            # Get the first prediction
            predictions_list = result[0]["predictions"]["predictions"]
            if predictions_list:
                detected_species = predictions_list[0].get("class")

        return {
            "success": True,
            "roboflow_result": detected_species,
            
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
