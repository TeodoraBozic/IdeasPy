from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from routers import auth, ideas, users, evaluations
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(title="Document backend project")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ili ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(ideas.router)
app.include_router(evaluations.router)
app.include_router(auth.router)