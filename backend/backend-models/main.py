from fastapi import FastAPI
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.routes import detect, price, heatmap

app = FastAPI(title="My FastAPI App")

# Connect to MongoDB on application startup
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

# Close MongoDB connection on application shutdown
@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include route modules
app.include_router(detect.router, prefix="/detect", tags=["Detect"])
app.include_router(price.router, prefix="/price", tags=["Price"])
app.include_router(heatmap.router, prefix="/heatmap", tags=["Heatmap"])

@app.get("/")
def root():
    return {"message": "FastAPI server is running 🚀"}
