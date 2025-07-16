from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError
from auth.dependencies import get_current_user
from database import users_col, ideas_col, evaluations_col

from models import Idea, IdeaDB, IdeaUpdate, UserDB


router= APIRouter(prefix="/ideas", tags=["Ideas"])

@router.post("/", response_model=IdeaDB, status_code=201)
async def create_idea(idea: Idea, current_user: UserDB = Depends(get_current_user)):
    idea_dict = idea.model_dump(exclude={"created_by"})
    idea_dict["created_by"] = str(current_user.id)

    try:
        res = await ideas_col.insert_one(idea_dict)
        idea_dict["_id"] = str(res.inserted_id)
        return IdeaDB(id=str(res.inserted_id), **idea_dict)
    except Exception as e:
        raise HTTPException(500, f"Greška prilikom kreiranja ideje: {str(e)}")

    
@router.get("idea/{idea_id}", response_model=IdeaDB)
async def get_idea(idea_id: str):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(404, "invalid id")
    
    result = await ideas_col.find_one({"_id": ObjectId(idea_id)})
    
    if result == None:
        raise HTTPException(400, "idea doesn't exist")
    
    result["_id"]=str(result["_id"])
    return IdeaDB(**result)

#sada da vratimo sve ideje:
@router.get("/", response_model=list[IdeaDB])
async def get_all_ideas():
    docs=[]
    async for idea in ideas_col.find():
        idea["_id"] = str(idea["_id"])
        docs.append(IdeaDB(**idea))
    if not docs:
        raise HTTPException(404, "Jos uvek nisu dodate ideje")
    return docs
    
        
#vrati sve ideje jednog korisnika
@router.get("userideas/{user_id}/", response_model=list[IdeaDB])
async def get_user_ideas(user_id:str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "nevalidan id korisnika")
    ideas =[]
    async for idea in ideas_col.find({"created_by": user_id}):
        idea["_id"] = str(idea["_id"])
        ideas.append(IdeaDB(**idea))
        
    if not ideas:
        raise HTTPException(404, "nema ideja tok korisnika")
    return ideas
        
        
@router.delete("/{idea_id}", status_code=204)
async def delete_idea(idea_id: str):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(400, "invalid idea_id")
    
    res = await ideas_col.delete_one({"_id": ObjectId(idea_id)})
    if res.deleted_count == 0:
        raise HTTPException(404, detail="Korisnik nije pronađen")
    
@router.patch("/{idea_id}", response_model=IdeaDB)
async def update_idea_patch(
    idea_id: str,
    ideaupdate: IdeaUpdate,
    current_user: UserDB = Depends(get_current_user)  # ⬅️ dodato
):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(404, "Nevažeći ID.")

    # 1. Prvo pronađi ideju
    existing_idea = await ideas_col.find_one({"_id": ObjectId(idea_id)})
    if not existing_idea:
        raise HTTPException(404, "Ideja nije pronađena.")

    # 2. Proveri da li je trenutni korisnik vlasnik
    if str(existing_idea["created_by"]) != str(current_user.id):
        raise HTTPException(403, "Nemaš dozvolu da menjaš ovu ideju.")

    # 3. Pripremi podatke za ažuriranje
    update_data = ideaupdate.model_dump(exclude_none=True, exclude_unset=True)
    if not update_data:
        raise HTTPException(400, "Nema podataka za ažuriranje.")

    # 4. Ažuriraj ideju
    await ideas_col.update_one(
        {"_id": ObjectId(idea_id)},
        {"$set": update_data}
    )

    # 5. Vrati ažuriranu ideju
    updated_idea = await ideas_col.find_one({"_id": ObjectId(idea_id)})
    updated_idea["_id"] = str(updated_idea["_id"])
    updated_idea["created_by"] = str(updated_idea["created_by"])  # dodatno, ako treba
    return IdeaDB(**updated_idea)