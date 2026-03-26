
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, JSON, DateTime, Boolean, Enum as SQLEnum, text, or_, and_, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
import enum

# --- CONFIGURATION ---
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./footpulse.db"

SECRET_KEY = os.getenv("SECRET_KEY", "FOOTBALL_DNA_SECRET_KEY_CHANGE_IN_PROD")
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
    DOCTOR = 'DOCTOR'

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
    player_ids = Column(JSON, nullable=True) # For Doctors
    position = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

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
    year = Column(Integer, nullable=True)
    week = Column(Integer, nullable=True)
    status = Column(String, default='PENDING')

class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    id = Column(String, primary_key=True, index=True)
    template_id = Column(String)
    user_id = Column(String, ForeignKey("users.id"))
    target_player_id = Column(String)
    month = Column(String)
    year = Column(Integer, nullable=True)
    week = Column(Integer, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    answers = Column(JSON)
    weighted_score = Column(Float)

class TrainingSession(Base):
    __tablename__ = "training_sessions"
    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime)
    trainer_id = Column(String, ForeignKey("users.id"))
    player_ids = Column(JSON) # List of player IDs

class TrainingEvaluation(Base):
    __tablename__ = "training_evaluations"
    id = Column(String, primary_key=True, index=True)
    training_session_id = Column(String, ForeignKey("training_sessions.id"))
    player_id = Column(String, ForeignKey("users.id"))
    rating = Column(Integer)
    comments = Column(String, nullable=True)

# --- DB INITIALIZATION ---
def init_db():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Check for missing columns (Migrations)
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("users")]
        
        # 1. Ensure player_ids exists (for Doctor persona)
        if "player_ids" not in columns:
            with engine.connect() as conn:
                col_type = "JSONB" if DATABASE_URL.startswith("postgresql") else "JSON"
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN player_ids {col_type}"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration error (player_ids): {e}")

    # 2. SurveyAssignment migrations
    if "survey_assignments" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("survey_assignments")]
        with engine.connect() as conn:
            if "year" not in columns:
                conn.execute(text("ALTER TABLE survey_assignments ADD COLUMN year INTEGER"))
            if "week" not in columns:
                conn.execute(text("ALTER TABLE survey_assignments ADD COLUMN week INTEGER"))
            conn.commit()

    # 3. SurveyResponse migrations
    if "survey_responses" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("survey_responses")]
        with engine.connect() as conn:
            if "year" not in columns:
                conn.execute(text("ALTER TABLE survey_responses ADD COLUMN year INTEGER"))
            if "week" not in columns:
                conn.execute(text("ALTER TABLE survey_responses ADD COLUMN week INTEGER"))
            conn.commit()

    # 4. Handle Postgres Enum update if necessary
        if DATABASE_URL.startswith("postgresql"):
            try:
                with engine.connect() as conn:
                    # Check if DOCTOR exists in the enum
                    # This is a bit complex in SQL, but we can try adding it and catch the error if it exists
                    conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'DOCTOR'"))
                    conn.commit()
            except Exception:
                # IF NOT EXISTS is supported in Postgres 9.4+
                pass

init_db()

# --- AUTH UTILS ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
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
    if not user.is_active:
         raise HTTPException(status_code=403, detail="Account is deactivated")
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
    player_ids: Optional[List[str]] = None
    position: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    role: Optional[UserRole] = None
    trainer_id: Optional[str] = None
    player_id: Optional[str] = None
    player_ids: Optional[List[str]] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str

class AdminResetPassword(BaseModel):
    new_password: str

class AssignmentCreate(BaseModel):
    template_id: str
    month: str
    year: int
    week: int
    respondent_ids: Optional[List[str]] = None
    target_ids: Optional[List[str]] = None
    bulk_type: Optional[str] = None

class SurveySubmit(BaseModel):
    template_id: str
    target_player_id: str
    month: str
    year: int
    week: int
    answers: Dict[str, int]
    weighted_score: float

class TrainingSessionCreate(BaseModel):
    date: datetime
    player_ids: List[str]

class TrainingEvaluationSubmit(BaseModel):
    player_id: str
    rating: int
    comments: Optional[str] = None

class TemplateCreateUpdate(BaseModel):
    name: str
    arName: str
    description: str
    arDescription: str
    categories: List[Dict[str, Any]]

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
        "playerId": u.player_id,
        "playerIds": u.player_ids,
        "position": u.position,
        "isActive": u.is_active
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
        "year": a.year,
        "week": a.week,
        "status": a.status
    }

def map_response(r: SurveyResponse):
    return {
        "id": r.id,
        "templateId": r.template_id,
        "userId": r.user_id,
        "targetPlayerId": r.target_player_id,
        "month": r.month,
        "year": r.year,
        "week": r.week,
        "date": r.date.isoformat(),
        "answers": r.answers,
        "weightedScore": r.weighted_score
    }

def map_training_session(s: TrainingSession, evaluations: List[TrainingEvaluation] = []):
    return {
        "id": s.id,
        "date": s.date.isoformat(),
        "trainerId": s.trainer_id,
        "playerIds": s.player_ids,
        "evaluations": [
            {
                "id": e.id,
                "trainingSessionId": e.training_session_id,
                "playerId": e.player_id,
                "rating": e.rating,
                "comments": e.comments
            } for e in evaluations
        ]
    }

# --- ROUTES ---

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": map_user(user)}

@app.get("/users")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        return [map_user(u) for u in db.query(User).all()]
    user_ids = {current_user.id}
    if current_user.role == UserRole.TRAINER:
        roster = db.query(User).filter(User.trainer_id == current_user.id).all()
        for u in roster: user_ids.add(u.id)
    elif current_user.role == UserRole.PLAYER:
        if current_user.trainer_id: user_ids.add(current_user.trainer_id)
        guardians = db.query(User).filter(User.player_id == current_user.id).all()
        for g in guardians: user_ids.add(g.id)
    elif current_user.role == UserRole.GUARDIAN and current_user.player_id:
        user_ids.add(current_user.player_id)
        child = db.query(User).filter(User.id == current_user.player_id).first()
        if child and child.trainer_id: user_ids.add(child.trainer_id)
    elif current_user.role == UserRole.DOCTOR:
        if current_user.player_ids:
            for p_id in current_user.player_ids: user_ids.add(p_id)
    users = db.query(User).filter(User.id.in_(list(user_ids)), User.is_active == True).all()
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
        player_ids=user_data.player_ids,
        position=user_data.position,
        avatar=f"https://picsum.photos/200/200?random={os.urandom(2).hex()}",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return map_user(db_user)

@app.patch("/users/{user_id}")
def update_user(user_id: str, data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if data.name is not None: user.name = data.name
    if data.email is not None: user.email = data.email
    if data.mobile is not None: user.mobile = data.mobile
    if data.role is not None: user.role = data.role
    if data.trainer_id is not None: user.trainer_id = data.trainer_id or None
    if data.player_id is not None: user.player_id = data.player_id or None
    if data.player_ids is not None: user.player_ids = data.player_ids or None
    if data.position is not None: user.position = data.position or None
    if data.is_active is not None: user.is_active = data.is_active
    db.commit()
    return map_user(user)

@app.patch("/users/me/password")
def change_own_password(data: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.currentPassword, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    current_user.password_hash = get_password_hash(data.newPassword)
    db.commit()
    return {"message": "Password updated"}

@app.patch("/users/{user_id}/reset-password")
def admin_reset_password(user_id: str, data: AdminResetPassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password reset success"}

@app.get("/templates")
def list_templates(db: Session = Depends(get_db)):
    return [map_template(t) for t in db.query(SurveyTemplateModel).all()]

@app.post("/templates")
def create_template(data: TemplateCreateUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    db_t = SurveyTemplateModel(
        id=f"t-{os.urandom(4).hex()}",
        name=data.name,
        ar_name=data.arName,
        description=data.description,
        ar_description=data.arDescription,
        categories=data.categories
    )
    db.add(db_t)
    db.commit()
    db.refresh(db_t)
    return map_template(db_t)

@app.put("/templates/{template_id}")
def update_template(template_id: str, data: TemplateCreateUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    t = db.query(SurveyTemplateModel).filter(SurveyTemplateModel.id == template_id).first()
    if not t: raise HTTPException(status_code=404, detail="Template not found")
    t.name = data.name
    t.ar_name = data.arName
    t.description = data.description
    t.ar_description = data.arDescription
    t.categories = data.categories
    db.commit()
    return map_template(t)

@app.delete("/templates/{template_id}")
def delete_template(template_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    t = db.query(SurveyTemplateModel).filter(SurveyTemplateModel.id == template_id).first()
    if t:
        db.delete(t)
        db.commit()
    return {"message": "Deleted"}

@app.get("/assignments")
def get_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        return [map_assignment(a) for a in db.query(SurveyAssignment).all()]
    
    # Specific filtering for non-admins
    if current_user.role == UserRole.TRAINER:
        # Trainer sees: Their own assignments OR guardian assignments for players they coach
        assignments = db.query(SurveyAssignment).all()
        results = []
        for a in assignments:
            if a.respondent_id == current_user.id:
                results.append(a)
            else:
                resp = db.query(User).filter(User.id == a.respondent_id).first()
                target = db.query(User).filter(User.id == a.target_id).first()
                if resp and resp.role == UserRole.GUARDIAN and target and target.trainer_id == current_user.id:
                    results.append(a)
        return [map_assignment(a) for a in results]
    
    if current_user.role == UserRole.DOCTOR:
        # Doctor sees: Their own assignments OR assignments for players they serve
        assignments = db.query(SurveyAssignment).all()
        results = []
        for a in assignments:
            if a.respondent_id == current_user.id:
                results.append(a)
            elif current_user.player_ids and a.target_id in current_user.player_ids:
                results.append(a)
        return [map_assignment(a) for a in results]
    
    return [map_assignment(a) for a in db.query(SurveyAssignment).filter(
        or_(
            SurveyAssignment.respondent_id == current_user.id,
            SurveyAssignment.target_id == current_user.id,
            (SurveyAssignment.respondent_id == current_user.player_id if current_user.role == UserRole.GUARDIAN else False),
            (SurveyAssignment.target_id == current_user.player_id if current_user.role == UserRole.GUARDIAN else False)
        )
    ).all()]

@app.post("/assignments/preview")
def preview_bulk_assignments(data: AssignmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    pairs = []
    all_users = db.query(User).filter(User.is_active == True).all()
    user_map = {u.id: u for u in all_users}
    if data.bulk_type:
        if data.bulk_type == "GUARDIANS_TO_CHILDREN":
            pairs = [(u, user_map.get(u.player_id)) for u in all_users if u.role == UserRole.GUARDIAN and u.player_id]
        elif data.bulk_type == "GUARDIANS_TO_COACHES":
            for u in all_users:
                if u.role == UserRole.GUARDIAN and u.player_id:
                    child = user_map.get(u.player_id)
                    if child and child.trainer_id:
                        coach = user_map.get(child.trainer_id)
                        if coach: pairs.append((u, coach))
        elif data.bulk_type == "PLAYERS_TO_COACHES":
            pairs = [(u, user_map.get(u.trainer_id)) for u in all_users if u.role == UserRole.PLAYER and u.trainer_id]
        elif data.bulk_type == "COACHES_TO_PLAYERS":
            for u in all_users:
                if u.role == UserRole.TRAINER:
                    roster = [p for p in all_users if p.trainer_id == u.id]
                    for p in roster: pairs.append((u, p))
        elif data.bulk_type == "DOCTORS_TO_PLAYERS":
            for u in all_users:
                if u.role == UserRole.DOCTOR and u.player_ids:
                    for p_id in u.player_ids:
                        p = user_map.get(p_id)
                        if p: pairs.append((u, p))
    elif data.respondent_ids and data.target_ids:
        for r_id in data.respondent_ids:
            for t_id in data.target_ids:
                r = user_map.get(r_id); t = user_map.get(t_id)
                if r and t: pairs.append((r, t))
    return [{"respondent": map_user(r), "target": map_user(t), "alreadyExists": db.query(SurveyAssignment).filter(SurveyAssignment.template_id == data.template_id, SurveyAssignment.respondent_id == r.id, SurveyAssignment.target_id == t.id, SurveyAssignment.month == data.month, SurveyAssignment.year == data.year, SurveyAssignment.week == data.week).first() is not None} for r, t in pairs if r and t]

@app.post("/assignments")
def create_assignments(data: AssignmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    pairs = []
    all_users = db.query(User).filter(User.is_active == True).all()
    user_map = {u.id: u for u in all_users}
    if data.bulk_type:
        if data.bulk_type == "GUARDIANS_TO_CHILDREN":
            pairs = [(u.id, u.player_id) for u in all_users if u.role == UserRole.GUARDIAN and u.player_id]
        elif data.bulk_type == "GUARDIANS_TO_COACHES":
            for u in all_users:
                if u.role == UserRole.GUARDIAN and u.player_id:
                    child = user_map.get(u.player_id)
                    if child and child.trainer_id: pairs.append((u.id, child.trainer_id))
        elif data.bulk_type == "PLAYERS_TO_COACHES":
            pairs = [(u.id, u.trainer_id) for u in all_users if u.role == UserRole.PLAYER and u.trainer_id]
        elif data.bulk_type == "COACHES_TO_PLAYERS":
            for u in all_users:
                if u.role == UserRole.TRAINER:
                    roster = [p.id for p in all_users if p.trainer_id == u.id]
                    for p_id in roster: pairs.append((u.id, p_id))
        elif data.bulk_type == "DOCTORS_TO_PLAYERS":
            for u in all_users:
                if u.role == UserRole.DOCTOR and u.player_ids:
                    for p_id in u.player_ids:
                        pairs.append((u.id, p_id))
    elif data.respondent_ids and data.target_ids:
        for r in data.respondent_ids:
            for t in data.target_ids: pairs.append((r, t))
    new_count = 0
    for r_id, t_id in pairs:
        if not db.query(SurveyAssignment).filter(SurveyAssignment.template_id == data.template_id, SurveyAssignment.respondent_id == r_id, SurveyAssignment.target_id == t_id, SurveyAssignment.month == data.month, SurveyAssignment.year == data.year, SurveyAssignment.week == data.week).first():
            db.add(SurveyAssignment(id=f"a-{os.urandom(4).hex()}", template_id=data.template_id, assigner_id=current_user.id, respondent_id=r_id, target_id=t_id, month=data.month, year=data.year, week=data.week))
            new_count += 1
    db.commit()
    return {"count": new_count}

@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    a = db.query(SurveyAssignment).filter(SurveyAssignment.id == assignment_id).first()
    if a:
        db.delete(a); db.commit()
    return {"message": "Deleted"}

@app.get("/responses")
def get_responses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        return [map_response(r) for r in db.query(SurveyResponse).all()]
    
    if current_user.role == UserRole.TRAINER:
        responses = db.query(SurveyResponse).all()
        results = []
        for r in responses:
            if r.user_id == current_user.id:
                results.append(r)
            else:
                target = db.query(User).filter(User.id == r.target_player_id).first()
                if target and target.trainer_id == current_user.id:
                    results.append(r)
        return [map_response(r) for r in results]
    
    if current_user.role == UserRole.DOCTOR:
        # Doctor sees: Their own responses OR responses for players they serve
        responses = db.query(SurveyResponse).all()
        results = []
        for r in responses:
            if r.user_id == current_user.id:
                results.append(r)
            elif current_user.player_ids and r.target_player_id in current_user.player_ids:
                results.append(r)
        return [map_response(r) for r in results]
    
    return [map_response(r) for r in db.query(SurveyResponse).filter(
        or_(
            SurveyResponse.user_id == current_user.id,
            SurveyResponse.target_player_id == current_user.id,
            (SurveyResponse.user_id == current_user.player_id if current_user.role == UserRole.GUARDIAN else False),
            (SurveyResponse.target_player_id == current_user.player_id if current_user.role == UserRole.GUARDIAN else False)
        )
    ).all()]

@app.post("/responses")
def submit_response(res: SurveySubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(SurveyAssignment).filter(SurveyAssignment.template_id == res.template_id, SurveyAssignment.respondent_id == current_user.id, SurveyAssignment.target_id == res.target_player_id, SurveyAssignment.month == res.month, SurveyAssignment.year == res.year, SurveyAssignment.week == res.week).first()
    db_res = SurveyResponse(
        id=f"sr-{os.urandom(4).hex()}",
        template_id=res.template_id,
        user_id=current_user.id,
        target_player_id=res.target_player_id,
        month=res.month,
        year=res.year,
        week=res.week,
        answers=res.answers,
        weighted_score=res.weighted_score
    )
    db.add(db_res)
    if assignment: assignment.status = 'COMPLETED'
    db.commit()
    return map_response(db_res)

@app.delete("/responses/{response_id}")
def delete_response(response_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    r = db.query(SurveyResponse).filter(SurveyResponse.id == response_id).first()
    if r:
        assignment = db.query(SurveyAssignment).filter(SurveyAssignment.template_id == r.template_id, SurveyAssignment.respondent_id == r.user_id, SurveyAssignment.target_id == r.target_player_id, SurveyAssignment.month == r.month, SurveyAssignment.year == r.year, SurveyAssignment.week == r.week).first()
        if assignment: assignment.status = 'PENDING'
        db.delete(r); db.commit()
    return {"message": "Deleted"}

# --- TRAINING SESSION ROUTES ---

@app.get("/training-sessions")
def list_training_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [UserRole.ADMIN, UserRole.TRAINER]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    query = db.query(TrainingSession)
    if current_user.role == UserRole.TRAINER:
        query = query.filter(TrainingSession.trainer_id == current_user.id)
    
    sessions = query.order_by(TrainingSession.date.desc()).all()
    return [map_training_session(s) for s in sessions]

@app.post("/training-sessions")
def create_training_session(data: TrainingSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(status_code=403, detail="Trainer only")
    
    db_session = TrainingSession(
        id=f"ts-{os.urandom(4).hex()}",
        date=data.date,
        trainer_id=current_user.id,
        player_ids=data.player_ids
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return map_training_session(db_session)

@app.get("/training-sessions/{session_id}")
def get_training_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == UserRole.TRAINER and session.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    evaluations = db.query(TrainingEvaluation).filter(TrainingEvaluation.training_session_id == session_id).all()
    return map_training_session(session, evaluations)

@app.patch("/training-sessions/{session_id}")
def update_training_session(session_id: str, data: TrainingSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role != UserRole.TRAINER or session.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    session.date = data.date
    session.player_ids = data.player_ids
    db.commit()
    return map_training_session(session)

@app.delete("/training-sessions/{session_id}")
def delete_training_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role != UserRole.TRAINER or session.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Delete evaluations first
    db.query(TrainingEvaluation).filter(TrainingEvaluation.training_session_id == session_id).delete()
    db.delete(session)
    db.commit()
    return {"message": "Deleted"}

@app.post("/training-sessions/{session_id}/evaluations")
def submit_training_evaluation(session_id: str, data: TrainingEvaluationSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role != UserRole.TRAINER or session.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if data.player_id not in session.player_ids:
        raise HTTPException(status_code=400, detail="Player not in session")
    
    # Check if evaluation already exists
    evaluation = db.query(TrainingEvaluation).filter(
        TrainingEvaluation.training_session_id == session_id,
        TrainingEvaluation.player_id == data.player_id
    ).first()
    
    if evaluation:
        evaluation.rating = data.rating
        evaluation.comments = data.comments
    else:
        evaluation = TrainingEvaluation(
            id=f"te-{os.urandom(4).hex()}",
            training_session_id=session_id,
            player_id=data.player_id,
            rating=data.rating,
            comments=data.comments
        )
        db.add(evaluation)
    
    db.commit()
    db.refresh(evaluation)
    return {
        "id": evaluation.id,
        "trainingSessionId": evaluation.training_session_id,
        "playerId": evaluation.player_id,
        "rating": evaluation.rating,
        "comments": evaluation.comments
    }
    