from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from bson import ObjectId
from fastapi.responses import JSONResponse
from pydantic import EmailStr, ValidationError
from pymongo.errors import DuplicateKeyError
import bcrypt
from auth.dependencies import get_current_user
from models import UserIn, UserDB, UserUpdate
from database import users_col
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserDB)
async def get_me(current_user: UserDB = Depends(get_current_user)):
    return current_user

 
# ------------------- CREATE -------------------
@router.post("/", response_model=UserDB, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserIn):
    try:
        user_dict = user.model_dump()
        # Hash password pre čuvanja
        hashed_password = bcrypt.hashpw(user_dict["password"].encode(), bcrypt.gensalt())
        user_dict["password"] = hashed_password.decode()

        result = await users_col.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)

        return JSONResponse(content={"id": user_dict["_id"], **user_dict})
    
    except ValidationError as ve:
        raise HTTPException(422, detail=str(ve))
    except DuplicateKeyError:
        raise HTTPException(409, detail="Email već postoji")
    except Exception as e:
        raise HTTPException(500, detail=f"Neočekivana greška: {e}")

# ------------------- READ -------------------
@router.get("/{user_id}", response_model=UserDB)
async def get_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, detail="ID nije validan")

    res = await users_col.find_one({"_id": ObjectId(user_id)})
    if not res:
        raise HTTPException(404, detail="Korisnik ne postoji")

    res["_id"]=str(res["_id"])
    return UserDB(**res)

# ------------------- DELETE by ID -------------------
@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, detail="ID nije validan")

    result = await users_col.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, detail="Korisnik nije pronađen")

# ------------------- DELETE by Username Contains -------------------
@router.delete("/delete_by_username/")
async def delete_users_by_username(username: str = Query(..., min_length=3)):
    query = {"username": {"$regex": username, "$options": "i"}}
    result = await users_col.delete_many(query)

    if result.deleted_count == 0:
        raise HTTPException(404, detail="Nijedan korisnik sa takvim imenom nije pronađen")

    return {"message": f"Obrisano {result.deleted_count} korisnika sa imenom koje sadrži '{username}'."}

# ------------------- PATCH -------------------
@router.patch("/{user_id}", response_model=UserDB)
async def update_user_patch(user_id: str, userupdate: UserUpdate):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, detail="ID nije validan")

    update_data = userupdate.model_dump(exclude_none=True, exclude_unset=True)

    # Hash password ako se menja
    if "password" in update_data:
        update_data["password"] = bcrypt.hashpw(
            update_data["password"].encode(), bcrypt.gensalt()
        ).decode()

    if not update_data:
        raise HTTPException(400, detail="Nema podataka za ažuriranje")

    result = await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(404, detail="Korisnik nije pronađen")

    updated_user = await users_col.find_one({"_id": ObjectId(user_id)})
    updated_user["_id"] = str(updated_user["_id"])
    return UserDB(**updated_user)

# ------------------- GET_ALL_USERS -------------------
#vrati sve korisnike:
router.get("/", response_model=list[UserDB])
async def get_all_users():
    docs=[]
    async for user in users_col.find():
        docs.append(UserDB(**user))
        
    if not docs:
        raise HTTPException(404, "Jos uvek nema korisnika")
    
    return docs

