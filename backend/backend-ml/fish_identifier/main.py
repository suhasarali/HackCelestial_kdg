from google import genai
from google.genai import types
import os

# --- CONFIGURATION ---
# Paste the key you got from AI Studio between the quotes
API_KEY = "AIzaSyAO1Ffna91bet1ersCigA33q9DzasyB4R4" 

# Initialize the Gemini "Client"
client = genai.Client(api_key=API_KEY)

def identify_my_fish(image_filename):
    print(f"Scanning {image_filename}...")
    
    try:
        # 1. Open the image file from your computer
        with open(image_filename, "rb") as f:
            image_data = f.read()

        # 2. Ask Gemini the question
        # We tell it specifically to act like a fish expert
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

        # 3. Show the result
        print("\n--- Result ---")
        print(response.text)

    except Exception as e:
        print(f"Something went wrong: {e}")

# --- RUN THE FUNCTION ---
identify_my_fish("image.png")