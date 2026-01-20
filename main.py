
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
import enum

# --- CONFIGURATION ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./footpulse.db")
SECRET_KEY = "FOOTBALL_DNA_SECRET_KEY_CHANGE_IN_PROD"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# --- DB SETUP ---
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class UserRole(str, enum.Enum):
    ADMIN = 'ADMIN'
    PLAYER = 'PLAYER'
    GUARDIAN = 'GUARDIAN'
    TRAINER = 'TRAINER'

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    mobile = Column(String)
    role = Column(SQLEnum(UserRole))
    avatar = Column(String, nullable=True)
    trainer_id = Column(String, ForeignKey("users.id"), nullable=True)
    player_id = Column(String, ForeignKey("users.id"), nullable=True)

class SurveyTemplateModel(Base):
    __tablename__ = "survey_templates"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    ar_name = Column(String)
    description = Column(String)
    ar_description = Column(String)
    categories = Column(JSON)

class SurveyAssignment(Base):
    __tablename__ = "survey_assignments"
    id = Column(String, primary_key=True, index=True)
    template_id = Column(String)
    assigner_id = Column(String, ForeignKey("users.id"))
    respondent_id = Column(String, ForeignKey("users.id"))
    target_id = Column(String)
    month = Column(String)
    status = Column(String, default='PENDING')

class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    id = Column(String, primary_key=True, index=True)
    template_id = Column(String)
    user_id = Column(String, ForeignKey("users.id"))
    target_player_id = Column(String)
    month = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    answers = Column(JSON)
    weighted_score = Column(Float)

Base.metadata.create_all(bind=engine)

# --- AUTH UTILS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- API ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- SCHEMAS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    mobile: str
    role: UserRole
    trainer_id: Optional[str] = None
    player_id: Optional[str] = None

class AdminResetPassword(BaseModel):
    new_password: str

class AssignmentCreate(BaseModel):
    template_id: str
    respondent_ids: List[str]
    target_ids: Optional[List[str]] = None
    month: str

class SurveySubmit(BaseModel):
    template_id: str
    target_player_id: str
    month: str
    answers: Dict[str, int]
    weighted_score: float

# --- HELPER MAPPERS ---
def map_user(u: User):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "mobile": u.mobile,
        "avatar": u.avatar,
        "trainerId": u.trainer_id,
        "playerId": u.player_id
    }

def map_template(t: SurveyTemplateModel):
    return {
        "id": t.id,
        "name": t.name,
        "arName": t.ar_name,
        "description": t.description,
        "arDescription": t.ar_description,
        "categories": t.categories
    }

def map_assignment(a: SurveyAssignment):
    return {
        "id": a.id,
        "templateId": a.template_id,
        "assignerId": a.assigner_id,
        "respondentId": a.respondent_id,
        "targetId": a.target_id,
        "month": a.month,
        "status": a.status
    }

def map_response(r: SurveyResponse):
    return {
        "id": r.id,
        "templateId": r.template_id,
        "userId": r.user_id,
        "targetPlayerId": r.target_player_id,
        "month": r.month,
        "date": r.date.isoformat(),
        "answers": r.answers,
        "weightedScore": r.weighted_score
    }

# --- ROUTES ---
@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": map_user(user)
    }

@app.get("/users")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        users = db.query(User).all()
    elif current_user.role == UserRole.TRAINER:
        users = db.query(User).filter((User.trainer_id == current_user.id) | (User.id == current_user.id)).all()
    else:
        users = [current_user]
    return [map_user(u) for u in users]

@app.post("/users")
def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    db_user = User(
        id=f"u-{os.urandom(4).hex()}",
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        mobile=user_data.mobile,
        role=user_data.role,
        trainer_id=user_data.trainer_id,
        player_id=user_data.player_id,
        avatar=f"https://picsum.photos/200/200?random={os.urandom(2).hex()}"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return map_user(db_user)

@app.patch("/users/{user_id}/reset-password")
def admin_reset_password(user_id: str, data: AdminResetPassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"detail": "Password reset successfully"}

@app.get("/templates")
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(SurveyTemplateModel).all()
    return [map_template(t) for t in templates]

@app.get("/assignments")
def get_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        assignments = db.query(SurveyAssignment).all()
    else:
        assignments = db.query(SurveyAssignment).filter(SurveyAssignment.respondent_id == current_user.id).all()
    return [map_assignment(a) for a in assignments]

@app.post("/assignments")
def create_assignments(data: AssignmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    new_assignments = []
    targets = data.target_ids if data.target_ids and len(data.target_ids) > 0 else [None]
    
    for r_id in data.respondent_ids:
        for t_id in targets:
            final_target = t_id if t_id else r_id
            existing = db.query(SurveyAssignment).filter(
                SurveyAssignment.template_id == data.template_id,
                SurveyAssignment.respondent_id == r_id,
                SurveyAssignment.target_id == final_target,
                SurveyAssignment.month == data.month
            ).first()
            if not existing:
                a = SurveyAssignment(
                    id=f"a-{os.urandom(4).hex()}",
                    template_id=data.template_id,
                    assigner_id=current_user.id,
                    respondent_id=r_id,
                    target_id=final_target,
                    month=data.month,
                    status='PENDING'
                )
                db.add(a)
                new_assignments.append(a)
    
    db.commit()
    return {"count": len(new_assignments)}

@app.get("/responses")
def get_responses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        responses = db.query(SurveyResponse).all()
    else:
        responses = db.query(SurveyResponse).filter(
            (SurveyResponse.user_id == current_user.id) | (SurveyResponse.target_player_id == current_user.id)
        ).all()
    return [map_response(r) for r in responses]

@app.post("/responses")
def submit_response(res: SurveySubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_res = SurveyResponse(
        id=f"sr-{os.urandom(4).hex()}",
        template_id=res.template_id,
        user_id=current_user.id,
        target_player_id=res.target_player_id,
        month=res.month,
        answers=res.answers,
        weighted_score=res.weighted_score,
        date=datetime.utcnow()
    )
    db.add(db_res)
    assignment = db.query(SurveyAssignment).filter(
        SurveyAssignment.template_id == res.template_id,
        SurveyAssignment.respondent_id == current_user.id,
        SurveyAssignment.target_id == res.target_player_id,
        SurveyAssignment.month == res.month
    ).first()
    if assignment:
        assignment.status = 'COMPLETED'
    
    db.commit()
    return map_response(db_res)

@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    if not db.query(User).filter(User.email == "admin@footpulse.app").first():
        admin = User(id="u-admin-1", name="Academy Director", email="admin@footpulse.app", password_hash=get_password_hash("password123"), mobile="+44 7700 900000", role=UserRole.ADMIN, avatar="https://picsum.photos/200/200?random=1")
        db.add(admin)
        trainer = User(id="u-trainer-1", name="Coach Mike Johnson", email="mike@footpulse.app", password_hash=get_password_hash("password123"), mobile="+44 7700 900001", role=UserRole.TRAINER, avatar="https://picsum.photos/200/200?random=2")
        db.add(trainer)
        player = User(id="u-player-1", name="Leo Messi Jr.", email="leo@footpulse.app", password_hash=get_password_hash("password123"), mobile="+44 7700 900002", role=UserRole.PLAYER, trainer_id="u-trainer-1", avatar="https://picsum.photos/200/200?random=3")
        db.add(player)
        db.commit()

    if db.query(SurveyTemplateModel).count() == 0:
        db_t = SurveyTemplateModel(
            id='t-trainer-eval', name="Trainer's Monthly Player Evaluation", ar_name="تقييم المدرب الشهري للاعب",
            description="Comprehensive performance review covering technical, physical, and behavioral metrics.", ar_description="مراجعة شاملة للأداء تغطي المقاييس الفنية والبدنية والسلوكية.",
            categories=[{
                "id": 'c-tech', "name": 'Technical Proficiency', "arName": 'الكفاءة الفنية', "weight": 100,
                "questions": [{"id": 'q-tech-1', "text": 'Ball Control & First Touch', "arText": 'التحكم بالكرة واللمسة الأولى', "weight": 100, "type": "RATING"}]
            }]
        )
        db.add(db_t)
        db.commit()
    db.close()
