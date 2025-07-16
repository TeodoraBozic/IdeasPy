from fastapi import Depends, HTTPException
from bson import ObjectId
from fastapi.security import OAuth2PasswordBearer
from database import users_col
from auth.jwt_handler import ALGORITHM, SECRET_KEY
from models import UserDB
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception

    # Ručno konvertuj ObjectId u string pre nego što kreiraš UserDB
    user["_id"] = str(user["_id"])
    return UserDB(**user)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None or role is None:
            raise JWTError()
        return {"id": user_id, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Nevažeći token")

