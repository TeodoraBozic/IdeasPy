import datetime
from datetime import datetime as dt
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError
from auth.dependencies import get_current_user
from database import users_col, ideas_col, evaluations_col

from models import Idea, IdeaDB, IdeaUpdate, UserDB

router = APIRouter(prefix="/ideas", tags=["Ideas"])


@router.post("/", response_model=IdeaDB, status_code=201)
async def create_idea(idea: Idea, current_user: UserDB = Depends(get_current_user)):
    idea_dict = idea.model_dump(exclude={"created_by"})
    idea_dict["created_by"] = str(current_user.id)

    try:
        res = await ideas_col.insert_one(idea_dict)
        idea_dict["_id"] = str(res.inserted_id)
        return IdeaDB(**idea_dict)
    except Exception as e:
        raise HTTPException(500, f"Greška prilikom kreiranja ideje: {str(e)}")


@router.get("/{idea_id}", response_model=IdeaDB)
async def get_idea(idea_id: str):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(404, "Invalid id")

    result = await ideas_col.find_one({"_id": ObjectId(idea_id)})
    if result is None:
        raise HTTPException(404, "Idea doesn't exist")

    # Prebaci _id u string
    result["_id"] = str(result["_id"])

    # Nađi username korisnika koji je kreirao ideju
    user = await users_col.find_one({"_id": ObjectId(result["created_by"])}, {"username": 1})
    if user:
        result["author_username"] = user["username"]
    else:
        result["author_username"] = "Nepoznat korisnik"

    # Još uvek vrati i created_by, ali kao string (ako ti treba u frontend-u)
    result["created_by"] = str(result["created_by"])

    return IdeaDB(**result)


@router.get("/", response_model=list[IdeaDB])
async def get_all_ideas():
    docs = []
    async for idea in ideas_col.find():
        # konverzija ID-ja ideje
        idea["_id"] = str(idea["_id"])

        # ako postoji created_by, izvuci username
        if "created_by" in idea:
            creator_id = idea["created_by"]
            if isinstance(creator_id, ObjectId):
                creator_id = str(creator_id)
            idea["created_by"] = creator_id

            # nadji usera u users_col
            user = await users_col.find_one({"_id": ObjectId(creator_id)}, {"username": 1})
            if user:
                idea["author_username"] = user.get("username")
            else:
                idea["author_username"] = None
        else:
            idea["author_username"] = None

        docs.append(idea)

    if not docs:
        raise HTTPException(404, "Jos uvek nisu dodate ideje")

    return docs

@router.get("/userideas/{user_id}/", response_model=list[IdeaDB])
async def get_user_ideas(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Nevalidan id korisnika")

    ideas = []
    async for idea in ideas_col.find({"created_by": user_id}):
        idea["_id"] = str(idea["_id"])
        idea["created_by"] = str(idea["created_by"])
        ideas.append(IdeaDB(**idea))

    if not ideas:
        raise HTTPException(404, "Nema ideja tog korisnika")
    return ideas


@router.delete("/{idea_id}", status_code=204)
async def delete_idea(idea_id: str):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(400, "Invalid idea_id")

    res = await ideas_col.delete_one({"_id": ObjectId(idea_id)})
    if res.deleted_count == 0:
        raise HTTPException(404, detail="Ideja nije pronađena")


@router.patch("/{idea_id}", response_model=IdeaDB)
async def update_idea_patch(
    idea_id: str,
    ideaupdate: IdeaUpdate,
    current_user: UserDB = Depends(get_current_user)
):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(404, "Nevažeći ID.")

    existing_idea = await ideas_col.find_one({"_id": ObjectId(idea_id)})
    if not existing_idea:
        raise HTTPException(404, "Ideja nije pronađena.")

    if str(existing_idea["created_by"]) != str(current_user.id):
        raise HTTPException(403, "Nemaš dozvolu da menjaš ovu ideju.")

    update_data = ideaupdate.model_dump(exclude_none=True, exclude_unset=True)
    if not update_data:
        raise HTTPException(400, "Nema podataka za ažuriranje.")

    await ideas_col.update_one(
        {"_id": ObjectId(idea_id)},
        {"$set": update_data}
    )

    updated_idea = await ideas_col.find_one({"_id": ObjectId(idea_id)})
    updated_idea["_id"] = str(updated_idea["_id"])
    updated_idea["created_by"] = str(updated_idea["created_by"])
    return IdeaDB(**updated_idea)


@router.get("/filter-ideje/")
async def filter_ideje(
    min_created_at: str | None = Query(None, description="Minimalni datum kreiranja (ISO format, npr. 2024-07-17T12:00:00)"),
    max_created_at: str | None = Query(None, description="Maksimalni datum kreiranja (ISO format)"),
    min_likes: int = Query(0, description="Minimalan broj lajkova"),
    min_score: float = Query(0.0, description="Minimalna prosečna ocena"),
    min_followers: int = Query(0, description="Minimalan broj pratilaca autora"),
):
    min_date = None
    max_date = None
    if min_created_at:
        try:
            min_date = dt.fromisoformat(min_created_at)
        except ValueError:
            raise HTTPException(400, "Nevalidan format za min_created_at (ISO string)")
    if max_created_at:
        try:
            max_date = dt.fromisoformat(max_created_at)
        except ValueError:
            raise HTTPException(400, "Nevalidan format za max_created_at (ISO string)")

    filter_query = {}
    if min_date or max_date:
        filter_query["created_at"] = {}
        if min_date:
            filter_query["created_at"]["$gte"] = min_date
        if max_date:
            filter_query["created_at"]["$lte"] = max_date

    ideje_cursor = ideas_col.find(filter_query)
    ideje = []

    async for idea in ideje_cursor:
        idea_id = str(idea["_id"])
        created_by = str(idea["created_by"])

        num_likes = await evaluations_col.count_documents({
            "idea_id": idea_id,
            "liked": True
        })
        if num_likes < min_likes:
            continue

        eval_cursor = evaluations_col.find({"idea_id": idea_id})
        ocene = [doc async for doc in eval_cursor]
        scores = [e.get("score") for e in ocene if isinstance(e.get("score"), (int, float))]
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0
        if avg_score < min_score:
            continue

        user_doc = await users_col.find_one({"_id": ObjectId(created_by)})
        if not user_doc:
            continue

        followers = len(user_doc.get("followers", []))
        if followers < min_followers:
            continue

        ideje.append({
            "title": idea["title"],
            "description": idea.get("description", ""),
            "author_id": created_by,
            "created_at": idea["created_at"],
            "likes": num_likes,
            "avg_score": avg_score,
            "followers": followers,
        })

    ideje.sort(key=lambda x: (x["likes"], x["avg_score"], x["followers"], x["created_at"]), reverse=True)
    return ideje
