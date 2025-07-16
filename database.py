from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URI)
db = client["doc-backend"]

# kolekcije
users_col = db["users"]
ideas_col = db["ideas"]
evaluations_col = db["evaluations"]
