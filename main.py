from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from routers import auth, ideas, users, evaluations


app = FastAPI(title="Document backend project")

app.include_router(users.router)
app.include_router(ideas.router)
app.include_router(evaluations.router)
app.include_router(auth.router)