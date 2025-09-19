from fastapi import FastAPI
from app.routes import detect, price, heatmap

app = FastAPI(title="My FastAPI App")

# Include route modules
app.include_router(detect.router, prefix="/detect", tags=["Detect"])
app.include_router(price.router, prefix="/price", tags=["Price"])
app.include_router(heatmap.router, prefix="/heatmap", tags=["Heatmap"])

@app.get("/")
def root():
    return {"message": "FastAPI server is running 🚀"}
