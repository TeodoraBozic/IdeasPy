import bcrypt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from auth.dependencies import get_current_user
from models import UserIn, UserLogin
from database import users_col
from auth.security import hash_password, verify_password
from auth.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])
 
@router.post("/register")
async def register(user: UserIn):
    if await users_col.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email već postoji")

    user_dict = user.dict()
    hashed_password = bcrypt.hashpw(user_dict["password"].encode(), bcrypt.gensalt())
    user_dict["password"] = hashed_password.decode()

    user_dict["role"] = "user"  # <-- postavi default rolu

    res = await users_col.insert_one(user_dict)
    return {"msg": "Registracija uspešna", "user_id": str(res.inserted_id)}


# @router.post("/login")
# async def login(form_data: OAuth2PasswordRequestForm = Depends()):
#     # form_data.username i form_data.password su dostupni
#     db_user = await users_col.find_one({"email": form_data.username})  # koristi username kao email
#     if not db_user or not verify_password(form_data.password, db_user["password"]):
#         raise HTTPException(status_code=401, detail="Pogrešan email ili lozinka")

#     token = create_access_token(str(db_user["_id"]))
#     return {"access_token": token, "token_type": "bearer"}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    print("Login attempt for:", form_data.username)
    user = await users_col.find_one({"email": form_data.username})
    print("User found:", user)
    if not user:
        raise HTTPException(status_code=401, detail="Pogrešan email ili lozinka")

    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Pogrešan email ili lozinka")

    access_token = create_access_token(data={"sub": str(user["_id"])})

    print("Token generated:", access_token)
    return {"access_token": access_token, "token_type": "bearer"}



#--------------------------------------------------------------------------------

def admin_required(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Samo admin ima pristup ovoj ruti.")
    return current_user

@router.get("/admin/test")
async def admin_test(current_user=Depends(admin_required)):
    return {"msg": f"Zdravo, admin {current_user.username}! Dobrodošao na admin stranicu."}


@router.post("/set-admin/{user_id}/")
async def set_admin(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(404, "invalid id")
    
    #user_id = current_user["id"]
    await users_col.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": "admin"}})
    return {"msg": "Sada si admin!"}
