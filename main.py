
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, JSON, DateTime, Boolean, Enum as SQLEnum, text
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
    if hasattr(user, 'is_active') and not user.is_active:
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
    position: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    role: Optional[UserRole] = None
    trainer_id: Optional[str] = None
    player_id: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None

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
        "position": u.position,
        "isActive": getattr(u, 'is_active', True)
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
    
    if hasattr(user, 'is_active') and not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": map_user(user)
    }

@app.get("/users")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        return [map_user(u) for u in db.query(User).all()]
    
    user_ids = {current_user.id}
    
    if current_user.role == UserRole.TRAINER:
        roster = db.query(User).filter(User.trainer_id == current_user.id).all()
        for u in roster: user_ids.add(u.id)
        assignments = db.query(SurveyAssignment).filter(SurveyAssignment.respondent_id == current_user.id).all()
        for a in assignments:
            if a.target_id: user_ids.add(a.target_id)
            
    elif current_user.role == UserRole.PLAYER:
        if current_user.trainer_id: user_ids.add(current_user.trainer_id)
        guardians = db.query(User).filter(User.player_id == current_user.id).all()
        for g in guardians: user_ids.add(g.id)
            
    elif current_user.role == UserRole.GUARDIAN:
        if current_user.player_id:
            user_ids.add(current_user.player_id)
            child = db.query(User).filter(User.id == current_user.player_id).first()
            if child and child.trainer_id:
                user_ids.add(child.trainer_id)

    for a in db.query(SurveyAssignment).filter(SurveyAssignment.respondent_id == current_user.id).all():
        if a.target_id: user_ids.add(a.target_id)
    for a in db.query(SurveyAssignment).filter(SurveyAssignment.target_id == current_user.id).all():
        user_ids.add(a.respondent_id)

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
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.is_active is False and user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot deactivate an Admin user")

    if data.name is not None: user.name = data.name
    if data.email is not None: user.email = data.email
    if data.mobile is not None: user.mobile = data.mobile
    if data.role is not None: user.role = data.role
    if data.trainer_id is not None: user.trainer_id = data.trainer_id
    if data.player_id is not None: user.player_id = data.player_id
    if data.position is not None: user.position = data.position
    if data.is_active is not None: user.is_active = data.is_active
    
    db.commit()
    db.refresh(user)
    return map_user(user)

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

# --- TEMPLATE ROUTES ---
@app.get("/templates")
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(SurveyTemplateModel).all()
    return [map_template(t) for t in templates]

@app.post("/templates")
def create_template(data: TemplateCreateUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    new_id = f"t-{os.urandom(4).hex()}"
    db_t = SurveyTemplateModel(
        id=new_id,
        name=data.name,
        ar_name=data.ar_name,
        description=data.description,
        ar_description=data.ar_description,
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
    db_t = db.query(SurveyTemplateModel).filter(SurveyTemplateModel.id == template_id).first()
    if not db_t:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db_t.name = data.name
    db_t.ar_name = data.ar_name
    db_t.description = data.description
    db_t.ar_description = data.ar_description
    db_t.categories = data.categories
    
    db.commit()
    return map_template(db_t)

@app.delete("/templates/{template_id}")
def delete_template(template_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    db_t = db.query(SurveyTemplateModel).filter(SurveyTemplateModel.id == template_id).first()
    if not db_t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(db_t)
    db.commit()
    return {"detail": "Template deleted"}

@app.get("/assignments")
def get_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        assignments = db.query(SurveyAssignment).all()
    else:
        # Show what they need to fill OR what is about them/their child
        assignments = db.query(SurveyAssignment).filter(
            (SurveyAssignment.respondent_id == current_user.id) | 
            (SurveyAssignment.target_id == current_user.id) |
            (SurveyAssignment.target_id == current_user.player_id)
        ).all()
    return [map_assignment(a) for a in assignments]

@app.post("/assignments")
def create_assignments(data: AssignmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    new_assignments = []
    targets = data.target_ids if data.target_ids and len(data.target_ids) > 0 else [None]
    
    for r_id in data.respondent_ids:
        # Safety for Guardians: If respondent is guardian, restrict target to their child
        resp_user = db.query(User).filter(User.id == r_id).first()
        actual_targets = targets
        if resp_user and resp_user.role == UserRole.GUARDIAN and resp_user.player_id:
            actual_targets = [resp_user.player_id]

        for t_id in actual_targets:
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

@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    db_assign = db.query(SurveyAssignment).filter(SurveyAssignment.id == assignment_id).first()
    if not db_assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # If the assignment is COMPLETED, we should also delete the response
    if db_assign.status == 'COMPLETED':
        db_res = db.query(SurveyResponse).filter(
            SurveyResponse.template_id == db_assign.template_id,
            SurveyResponse.user_id == db_assign.respondent_id,
            SurveyResponse.target_player_id == db_assign.target_id,
            SurveyResponse.month == db_assign.month
        ).first()
        if db_res:
            db.delete(db_res)
            
    db.delete(db_assign)
    db.commit()
    return {"detail": "Assignment deleted successfully"}

@app.get("/responses")
def get_responses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.ADMIN:
        responses = db.query(SurveyResponse).all()
    else:
        responses = db.query(SurveyResponse).filter(
            (SurveyResponse.user_id == current_user.id) | 
            (SurveyResponse.target_player_id == current_user.id) |
            (SurveyResponse.target_player_id == current_user.player_id)
        ).all()
    return [map_response(r) for r in responses]

@app.post("/responses")
def submit_response(res: SurveySubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_month_str = datetime.utcnow().strftime("%Y-%m")
    
    # Restriction: Non-admins cannot submit surveys for future months
    if res.month > current_month_str and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Surveys cannot be submitted for future months")

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

@app.delete("/responses/{response_id}")
def delete_response(response_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    db_res = db.query(SurveyResponse).filter(SurveyResponse.id == response_id).first()
    if not db_res:
        raise HTTPException(status_code=404, detail="Response not found")
    
    # Revert assignment status
    assignment = db.query(SurveyAssignment).filter(
        SurveyAssignment.template_id == db_res.template_id,
        SurveyAssignment.respondent_id == db_res.user_id,
        SurveyAssignment.target_id == db_res.target_player_id,
        SurveyAssignment.month == db_res.month
    ).first()
    if assignment:
        assignment.status = 'PENDING'
    
    db.delete(db_res)
    db.commit()
    return {"detail": "Response deleted and assignment reverted"}

@app.on_event("startup")
def setup_logic():
    db = SessionLocal()
    
    # --- MIGRATIONS ---
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
        db.commit()
    except Exception:
        db.rollback()

    try:
        db.execute(text("ALTER TABLE users ADD COLUMN position VARCHAR"))
        db.commit()
    except Exception:
        db.rollback()

    # --- SEED DATA WITH ID CHECKS ---
    admin_id = "u-admin-1"
    admin_email = "admin@footpulse.app"
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin:
        # Check if email exists for another ID (to prevent UNIQUE violation)
        existing_email_user = db.query(User).filter(User.email == admin_email).first()
        if not existing_email_user:
            admin = User(
                id=admin_id, 
                name="Academy Director", 
                email=admin_email, 
                password_hash=get_password_hash("password123"), 
                mobile="+44 7700 900000", 
                role=UserRole.ADMIN, 
                avatar="https://picsum.photos/200/200?random=1",
                is_active=True
            )
            db.add(admin)
    else:
        admin.password_hash = get_password_hash("password123")
        admin.is_active = True
    
    trainer_id = "u-trainer-1"
    trainer_email = "mike@footpulse.app"
    trainer = db.query(User).filter(User.id == trainer_id).first()
    if not trainer:
        if not db.query(User).filter(User.email == trainer_email).first():
            trainer = User(
                id=trainer_id, 
                name="Coach Mike Johnson", 
                email=trainer_email, 
                password_hash=get_password_hash("password123"), 
                mobile="+44 7700 900001", 
                role=UserRole.TRAINER, 
                avatar="https://picsum.photos/200/200?random=2", 
                is_active=True
            )
            db.add(trainer)
    
    player_id = "u-player-1"
    player_email = "leo@footpulse.app"
    player = db.query(User).filter(User.id == player_id).first()
    if not player:
        if not db.query(User).filter(User.email == player_email).first():
            player = User(
                id=player_id, 
                name="Leo Messi Jr.", 
                email=player_email, 
                password_hash=get_password_hash("password123"), 
                mobile="+44 7700 900002", 
                role=UserRole.PLAYER, 
                trainer_id="u-trainer-1", 
                position="Forward", 
                avatar="https://picsum.photos/200/200?random=3", 
                is_active=True
            )
            db.add(player)
    
    db.commit()
    db.close()
