from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId

from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError
from database import users_col, ideas_col, evaluations_col

from models import Evaluation, EvaluationDB

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])

@router.post("/{idea_id}/{user_id}/", response_model=EvaluationDB)
async def evaluate_idea(eval: Evaluation):
    from bson.errors import InvalidId
    
    try:
        user_obj_id = ObjectId(eval.user_id)
        idea_obj_id = ObjectId(eval.idea_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Nevalidan ID korisnika ili ideje")

    # Provera da li korisnik postoji
    if not await users_col.find_one({"_id": user_obj_id}):
        raise HTTPException(404, "Korisnik ne postoji")

    # Dohvati ideju iz baze
    idea = await ideas_col.find_one({"_id": idea_obj_id})
    if not idea:
        raise HTTPException(404, "Ideja ne postoji")

    # Provera da li korisnik ocenjuje svoju ideju
    if idea.get("created_by") == str(user_obj_id):
        raise HTTPException(status_code=400, detail="Ne možeš oceniti svoju ideju")

    # Nastavak unosa ocene...
    try:
        doc = eval.model_dump()
        res = await evaluations_col.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return EvaluationDB(**doc)
    except Exception as e:
        raise HTTPException(500, f"Greska prilikom ocenjivanja ideje: {str(e)}")

    
#ne radi!!!!!!!!!!!!!!!!!!!!!!!!!11
@router.get("/getall/", response_model=list[EvaluationDB])
async def get_all_evaluations():
    docs=[]
    async for eval in evaluations_col.find():
        print("Evaluation iz baze:", eval)
        eval["_id"]=str(eval["_id"])
        docs.append(EvaluationDB(**eval))
    if not docs:
        raise HTTPException(404, "Jos uvek nema evidentiranog ocenjivanja")
    return docs

@router.get("/vratisveocene/{idea_id}")
async def vratisveocene(idea_id: str):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(400, "invalid idea_id")
    
    eval_docs = []
    async for doc in evaluations_col.find({"idea_id": idea_id}):
        eval_docs.append(doc)

    if not eval_docs:
        raise HTTPException(404, "No evaluations found for this idea")

    # Izračunavanje prosečne ocene
    ocene = [doc.get("score") for doc in eval_docs if isinstance(doc.get("score"), (int, float))]
    prosek = round(sum(ocene) / len(ocene), 2) if ocene else 0

    result = []
    for eval_doc in eval_docs:
        # Dohvati korisnika
        user = await users_col.find_one({"_id": ObjectId(eval_doc["user_id"])})
        username = user.get("username", "Nepoznat korisnik") if user else "Nepoznat korisnik"

        # Dohvati ideju
        idea = await ideas_col.find_one({"_id": ObjectId(eval_doc["idea_id"])})
        idea_title = idea.get("title", "Nepoznata ideja") if idea else "Nepoznata ideja"

        result.append({
            "Korisnik": username,
            "Naziv ideje": idea_title,
            "Ocena": eval_doc.get("score"),
            "Komentar": eval_doc.get("comment", ""),
            "Ukupna ocena": prosek
        })

    return result

#----------------Radi----------------------
@router.post("/like")
async def like_idea(user_id: str, idea_id: str):
    if not ObjectId.is_valid(user_id) or not ObjectId.is_valid(idea_id):
        raise HTTPException(400, "Invalid user_id or idea_id")
    
    
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    idea = await ideas_col.find_one({"_id": ObjectId(idea_id)})
    
    if not user or not idea: 
        raise HTTPException(404, "ne postoji korisnik ili ideja")
    
    #provera da li je vec lajkovao ovo:
    existing_eval = await evaluations_col.find_one({"user_id": user_id, "idea_id": idea_id})
    
    if existing_eval: #ako postoji ideja onda 
        # Toggle liked polje
        new_liked = not existing_eval.get("liked", False)
        await evaluations_col.update_one(
            {"_id": existing_eval["_id"]},
            {"$set": {"liked": new_liked}}
        )
        return {"msg": f"Idea {'liked' if new_liked else 'unliked'} successfully."}
    else:
        # Kreiraj novu evaluaciju sa liked=True i default ocenom (npr. 0 ili 1)
        new_eval = {
            "user_id": user_id,
            "idea_id": idea_id,
            "score": None,  # ili None, pošto ocena nije obavezna za like
            "comment": "",
            "liked": True
        }
        await evaluations_col.insert_one(new_eval)
        return {"msg": "Idea liked successfully."}
    
#radi
@router.get("/likes/count/{idea_id}")
async def get_likes_count(idea_id: str):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(404, "invalid idea_id")
    
    like_count = await evaluations_col.count_documents({"idea_id": idea_id, "liked": True})
    
    return {"idea_id": idea_id, "like_count": like_count}

#radi!
#treba da izlista sve korisnike koji su lajkovali ideju
@router.get("/likes/usernames/{idea_id}")
async def get_usernames_who_liked(idea_id:str):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(404, "invalid idea_id")
   
    
    lajkovane_ideje = evaluations_col.find({"idea_id": idea_id, "liked": True})
    
    #to je lista
    usernames = []
    async for i in lajkovane_ideje:
        user_id = i.get("user_id")
        user  = await users_col.find_one({"_id": ObjectId(user_id)})
        if user and "username" in user:
            usernames.append(user["username"])
            
    return {"idea_id": idea_id, "liked_usernames": usernames}
            
    





    
   




