from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

from database import users_col, ideas_col, evaluations_col
from models import Evaluation, EvaluationDB

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


@router.post("/", response_model=EvaluationDB)
async def evaluate_idea(eval: Evaluation):
    """
    Korisnik ocenjuje / lajkuje / komentariše ideju.
    Sve je opciono: score, liked, comment.
    Ako već postoji evaluacija za (idea_id, user_id) → radi update.
    Ako ne postoji → kreira novu.
    """
    try:
        user_obj_id = ObjectId(eval.user_id)
        idea_obj_id = ObjectId(eval.idea_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Nevalidan ID korisnika ili ideje")

    # Provera postojanja korisnika
    if not await users_col.find_one({"_id": user_obj_id}):
        raise HTTPException(404, "Korisnik ne postoji")

    # Provera postojanja ideje
    idea = await ideas_col.find_one({"_id": idea_obj_id})
    if not idea:
        raise HTTPException(404, "Ideja ne postoji")

    # Zabrani samoevaluaciju
    if idea.get("created_by") == str(user_obj_id):
        raise HTTPException(status_code=400, detail="Ne možeš oceniti svoju ideju")

    # Ukloni None vrednosti (da se ne prepisuje postojećim null-om)
    doc = eval.model_dump(exclude_none=True)
    doc["idea_id"] = str(idea_obj_id)
    doc["user_id"] = str(user_obj_id)

    # Upsert (update or insert)
    result = await evaluations_col.find_one_and_update(
        {"idea_id": doc["idea_id"], "user_id": doc["user_id"]},
        {"$set": doc},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    result["_id"] = str(result["_id"])
    return EvaluationDB(**result)


@router.get("/getall/", response_model=list[EvaluationDB])
async def get_all_evaluations():
    """
    Vrati sve evaluacije.
    """
    docs = []
    async for ev in evaluations_col.find():
        ev["_id"] = str(ev["_id"])
        if "idea_id" in ev:
            ev["idea_id"] = str(ev["idea_id"])
        if "user_id" in ev:
            ev["user_id"] = str(ev["user_id"])
        try:
            docs.append(EvaluationDB(**ev))
        except Exception:
            continue

    if not docs:
        raise HTTPException(404, "Jos uvek nema evidentiranog ocenjivanja")
    return docs


@router.get("/vratisveocene/{idea_id}")
async def vratisveocene(idea_id: str):
    """
    Vrati sve evaluacije za datu ideju + prosečnu ocenu.
    """
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(400, "invalid idea_id")

    eval_docs = []
    async for doc in evaluations_col.find({"idea_id": idea_id}):
        eval_docs.append(doc)

    if not eval_docs:
        raise HTTPException(404, "No evaluations found for this idea")

    ocene = [doc.get("score") for doc in eval_docs if isinstance(doc.get("score"), (int, float))]
    prosek = round(sum(ocene) / len(ocene), 2) if ocene else 0

    result = []
    for eval_doc in eval_docs:
        # korisnik
        username = "Nepoznat korisnik"
        try:
            user = await users_col.find_one({"_id": ObjectId(eval_doc["user_id"])})
            if user and "username" in user:
                username = user["username"]
        except Exception:
            pass

        # ideja
        idea_title = "Nepoznata ideja"
        try:
            idea = await ideas_col.find_one({"_id": ObjectId(eval_doc["idea_id"])})
            if idea and "title" in idea:
                idea_title = idea["title"]
        except Exception:
            pass

        result.append({
            "Korisnik": username,
            "Naziv ideje": idea_title,
            "Ocena": eval_doc.get("score"),
            "Komentar": eval_doc.get("comment", ""),
            "Ukupna ocena": prosek
        })

    return result


@router.get("/likes/count/{idea_id}")
async def get_likes_count(idea_id: str):
    """
    Broj lajkova za ideju.
    """
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(400, "invalid idea_id")

    like_count = await evaluations_col.count_documents({"idea_id": idea_id, "liked": True})
    return {"idea_id": idea_id, "like_count": like_count}


@router.get("/likes/usernames/{idea_id}")
async def get_usernames_who_liked(idea_id: str):
    """
    Usernames korisnika koji su lajkovali ideju.
    """
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(400, "invalid idea_id")

    usernames = []
    async for ev in evaluations_col.find({"idea_id": idea_id, "liked": True}):
        user_id = ev.get("user_id")
        try:
            user = await users_col.find_one({"_id": ObjectId(user_id)})
            if user and "username" in user:
                usernames.append(user["username"])
        except Exception:
            continue

    return {"idea_id": idea_id, "liked_usernames": usernames}
