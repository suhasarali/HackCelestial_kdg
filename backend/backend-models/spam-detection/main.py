# from fastapi import FastAPI
# from pydantic import BaseModel
# import joblib

# # Initialize the FastAPI app
# app = FastAPI(title="Spam Detection API")

# # Define the request body structure for clarity in the docs
# class Message(BaseModel):
#     text: str

# # --- Load the saved model and vectorizer ---
# # These files must be in the same directory as this script.
# try:
#     model = joblib.load('spam_detector_model.pkl')
#     vectorizer = joblib.load('tfidf_vectorizer.pkl')
#     print("✅ Model and vectorizer loaded successfully.")
# except FileNotFoundError:
#     print("❌ Error: Model or vectorizer files not found.")
#     print("Ensure 'spam_detector_model.pkl' and 'tfidf_vectorizer.pkl' are in the same folder.")
#     model = None
#     vectorizer = None


# # --- Define the prediction endpoint ---
# @app.post("/predict")
# async def predict_spam(message: Message):
#     """
#     Predicts if a given message is spam or not.
#     - **text**: The text of the announcement to check.
#     """
#     if not model or not vectorizer:
#         return {"error": "Model not loaded. Check server logs."}

#     # 1. Transform the new message text using the loaded vectorizer
#     message_tfidf = vectorizer.transform([message.text])
    
#     # 2. Make a prediction using the loaded model
#     prediction_code = model.predict(message_tfidf)[0]
    
#     # 3. Get the probability of it being spam
#     spam_probability = model.predict_proba(message_tfidf)[0][1]

#     # 4. Determine the label. We've added a new condition for high-probability spam.
#     if spam_probability > 0.70:
#         result = "high_probability_spam"
#     elif prediction_code == 1:
#         result = "spam"
#     else:
#         result = "ham"

#     # 5. Return the result as a JSON response
#     return {
#         "message": message.text,
#         "prediction": result,
#         "spam_probability": f"{spam_probability:.2%}" # Format as a percentage
#     }

# # Define a root endpoint for basic info
# @app.get("/")
# def read_root():
#     return {"message": "Spam Detection API is running. Send a POST request to /predict"}

# # To run this API, save the code as main.py and run the following command in your terminal:
# # uvicorn main:app --reload