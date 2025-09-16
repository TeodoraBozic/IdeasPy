from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from bson import ObjectId
from fastapi.responses import JSONResponse
from pydantic import EmailStr, ValidationError
from pymongo.errors import DuplicateKeyError
import bcrypt
from auth.dependencies import get_current_user
from models import UserIn, UserDB, UserPublic, UserUpdate
from database import users_col, ideas_col
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
@router.patch("/updateMe", response_model=UserDB)
async def update_user_patch(userupdate: UserUpdate, current_user: UserDB = Depends(get_current_user)):
    
    user_id = str(current_user.id)
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
@router.get("/", response_model=list[UserPublic])
async def get_all_users():
    docs=[]
    async for user in users_col.find():
        docs.append(UserPublic(**user))
        
    if not docs:
        raise HTTPException(404, "Jos uvek nema korisnika")
    
    return docs



#--------------------Follow-------------------------

#korisnici mogu medjusobno da se prate, ulogovani korisnik ce da zaprati
@router.post("/follow/{username}")
async def follow_user_with_username(username: str, current_user: UserDB = Depends(get_current_user)):
    usernamecurrent = str(current_user.username)

    if usernamecurrent == username:
        raise HTTPException(400, "Ne možeš zapratiti sam sebe")

    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(404, "Ne postoji korisnik kog želiš da zapratiš")

    if username in current_user.following:
        raise HTTPException(400, "Već pratiš ovog korisnika")

    # Update korisnika kog zapraćuješ -> dodaj pratioca
    await users_col.update_one(
        {"username": username},
        {"$addToSet": {"followers": usernamecurrent}}
    )

    # Update trenutno ulogovanog korisnika -> dodaj da on prati drugog
    await users_col.update_one(
        {"username": usernamecurrent},
        {"$addToSet": {"following": username}}
    )

    return {"msg": "Uspešno si zapratio korisnika"}


    

@router.post("/unfollow/{username}")
async def unfollow_user_with_username(username: str, current_user: UserDB = Depends(get_current_user)):
    usernamecurrent = str(current_user.username)

    if usernamecurrent == username:
        raise HTTPException(400, "Ne možeš otpratiti sam sebe")

    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(404, "Ne postoji korisnik kog želiš da otpratiš")

    if username not in current_user.following:
        raise HTTPException(400, "Ne pratiš tog korisnika")

    # izbrisi me iz liste followers kod target usera
    await users_col.update_one(
        {"username": username},
        {"$pull": {"followers": usernamecurrent}}
    )

    # izbrisi target username iz liste following kod mene
    await users_col.update_one(
        {"username": usernamecurrent},
        {"$pull": {"following": username}}
    )

    return {"msg": "Uspešno si otpratio korisnika"}


# Prikaži sve pratioce (followers) po username
@router.get("/followers/{username}")
async def get_all_followers(username: str):
    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(404, "Korisnik nije pronađen")

    follower_usernames = user.get("followers", [])
    if not follower_usernames:
        return []

    followers = await users_col.find(
        {"username": {"$in": follower_usernames}},
        {"username": 1}
    ).to_list(length=None)

    return [f["username"] for f in followers if "username" in f]


# Prikaži sve koje korisnik prati (following) po username
@router.get("/following/{username}")
async def get_all_following(username: str):
    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(404, "Korisnik nije pronađen")

    following_usernames = user.get("following", [])
    if not following_usernames:
        return []

    following = await users_col.find(
        {"username": {"$in": following_usernames}},
        {"username": 1}
    ).to_list(length=None)

    return [f["username"] for f in following if "username" in f]




#profil korisnika: ovo radi mada bi moglo da se malo doradi
@router.get("/user-info/by-username/{username}")
async def get_user_info_by_username(username: str):
    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(404, "user doesn't exist")

    # sve ideje korisnika
    ideas = await ideas_col.find({"created_by": str(user["_id"])}).to_list(length=None)

    # followers po username
    follower_usernames = user.get("followers", [])
    followers = await users_col.find(
        {"username": {"$in": follower_usernames}},
        {"username": 1}
    ).to_list(length=None)

    # following po username
    following_usernames = user.get("following", [])
    following = await users_col.find(
        {"username": {"$in": following_usernames}},
        {"username": 1}
    ).to_list(length=None)

    return {
        "username": user["username"],
        "email": user["email"],
        "title": user.get("title"),
        "ideas": [{"id": str(i["_id"]), "title": i["title"]} for i in ideas],
        "followers": [f["username"] for f in followers],
        "following": [f["username"] for f in following],
    }



@router.get("/ideas/by-popular-creators")
async def get_ideas_by_popular_creators():
    users = await users_col.find().to_list(length=None)
    
    # Sortiraj korisnike po broju pratilaca
    sorted_users = sorted(users, key=lambda u: len(u.get("followers", [])), reverse=True)

    result = []
    for user in sorted_users:
        ideas = await ideas_col.find({"created_by": str(user["_id"])}).to_list(length=None)
        for idea in ideas:
            result.append({
                "id": str(idea["_id"]),
                "title": idea["title"],
                "creator": user["username"],
                "followers_count": len(user.get("followers", []))
            })

    return result



