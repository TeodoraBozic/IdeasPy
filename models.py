import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Annotated, List, Optional
from bson import ObjectId



#ova klasa nam omogucava da objectid (koji mongo koristi) koristimo kao string 
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, *_):
        from pydantic_core import core_schema
        return core_schema.str_schema()

class Role(str, Enum):
    user = "user"
    admin = "admin"

class UserIn(BaseModel):  #ovaj ce da bude za registraciju
    username: Annotated[str, Field(min_length=3, max_length=30)]
    email: str
    password: Annotated[str, Field(min_length=6)]
    title: Optional[str] = None            # npr. "Software Developer"
    description: Optional[str] = None      # kratki opis (bio)
    location: Optional[str] = None         # npr. "Novi Sad, Srbija"
    skills: Optional[List[str]] = Field(default_factory=list)

    
    
    
class UserLogin(BaseModel):
    email: str
    password: str
    
class UserDB(UserIn):
    id: Annotated[PyObjectId, Field(alias="_id")]
    role: Role
    followers: Optional[List[str]] = Field(default_factory=list)
    following: Optional[List[str]] = Field(default_factory=list)


    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    email: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    title: Optional[str] = None            # npr. "Software Developer"
    description: Optional[str] = None      # kratki opis (bio)
    location: Optional[str] = None         # npr. "Novi Sad, Srbija"
    skills: Optional[List[str]] = []       # lista veština
    
#----------------------------------------------------------------------------------------

class Idea(BaseModel):
    title: str
    description: str
    market: str
    target_audience:str
    #created_by: PyObjectId
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    #mozda ovde treba ocene pa za rangiranje
    
    
class IdeaDB(Idea):
    id: Annotated[PyObjectId, Field(alias="_id")]
    created_by: PyObjectId
    
    model_config = ConfigDict(
        populate_by_name=True, 
        json_encoders={ObjectId: str}, 
        arbitrary_types_allowed=True
    )
    
    
class IdeaUpdate(Idea):
    title: Optional[str] = None
    description: Optional[str] = None
    market: Optional[str] = None
    target_audience: Optional[str] = None
    #created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
class Evaluation(BaseModel):
    idea_id: PyObjectId
    user_id:PyObjectId
    score: Annotated[int, Field(ge=1, le=5)]
    comment: Optional[str] = None
    liked: bool = False
    
    
class EvaluationDB(Evaluation):
    id: Annotated[PyObjectId, Field(alias="_id")]
    
    model_config = ConfigDict(
        populate_by_name=True, 
        json_encoders={ObjectId: str}, 
        arbitrary_types_allowed=True
    )
    

#---------------------------------------

#update modeli kasnije!
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
    
    