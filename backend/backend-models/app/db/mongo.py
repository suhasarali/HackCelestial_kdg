from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, MONGO_DB_NAME

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

db = MongoDB()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(MONGO_URI)
    db.database = db.client[MONGO_DB_NAME]
    print("Connected to MongoDB!")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection.")