import os
import sys
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import inspect
from dotenv import load_dotenv
import bcrypt
from datetime import datetime

# Add parent directory to path to import from bd module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable is not set!")
    sys.exit(1)

# Create database engine
engine = create_engine(
    DATABASE_URL,
    echo=True  # Set to True to see SQL queries
)

# Create base class for declarative models
Base = declarative_base()

# Define User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    identity_document = Column(String, unique=True, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with Login model
    logins = relationship("Login", back_populates="user", cascade="all, delete-orphan")
    # Relationship with MetaUser model
    meta_user = relationship("MetaUser", back_populates="user", uselist=False, cascade="all, delete-orphan")
    # Relationship with Applications
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")

# Define Login model
class Login(Base):
    __tablename__ = "logins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    password_hash = Column(String, nullable=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with User model
    user = relationship("User", back_populates="logins")
    
    def set_password(self, password):
        """Hash password and store it"""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches stored hash"""
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)

# Define MetaUser model
class MetaUser(Base):
    __tablename__ = "meta_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    fullname = Column(String, nullable=False)
    celular = Column(String, nullable=False)
    # Store resume filename or identifier (e.g., returned by CV upload)
    resume_pdf = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with User model
    user = relationship("User", back_populates="meta_user")

# Define Job model
class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title_job = Column(String, nullable=False)
    description = Column(String, nullable=False)
    # Ideal profile text to drive NLP preselection
    perfil_ideal = Column(String, nullable=True)
    posted_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with Applications
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

# Define Application model
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    status = Column(String, default="in_progress")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    stages = relationship("ApplicationStage", back_populates="application", cascade="all, delete-orphan")

# Define ApplicationStage model to track timeline
class ApplicationStage(Base):
    __tablename__ = "application_stages"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    name = Column(String, nullable=False)  # one of: application, interview, test, result
    status = Column(String, nullable=False, default="pending")  # pending | in_progress | scheduled | completed | rejected | accepted
    date = Column(DateTime, nullable=True)
    feedback = Column(String, nullable=True)
    sort_order = Column(Integer, nullable=False, default=1)

    application = relationship("Application", back_populates="stages")

def create_tables():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

    # Lightweight migration: ensure resume_pdf column exists in meta_users
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns("meta_users")
        column_names = {col["name"] for col in columns}
        if "resume_pdf" not in column_names:
            # Use transactional BEGIN so the DDL is committed (Postgres supports transactional DDL)
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE meta_users ADD COLUMN resume_pdf VARCHAR")
                )
            print("✅ Added missing column resume_pdf to meta_users")
    except Exception as e:
        print(f"⚠️ Could not verify/add resume_pdf column: {e}")

    # Lightweight migration: ensure posted_date column exists in jobs
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns("jobs")
        column_names = {col["name"] for col in columns}
        if "posted_date" not in column_names:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE jobs ADD COLUMN posted_date TIMESTAMP NULL")
                )
            print("✅ Added missing column posted_date to jobs")
        # Add perfil_ideal if missing
        if "perfil_ideal" not in column_names:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE jobs ADD COLUMN perfil_ideal VARCHAR NULL")
                )
            print("✅ Added missing column perfil_ideal to jobs")
    except Exception as e:
        print(f"⚠️ Could not verify/add posted_date column: {e}")

    # No-destructive check: ensure new tables exist (already done by create_all above)

def create_admin_user():
    """Create a default admin user if none exists"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Check if admin user already exists
    admin = session.query(User).filter(User.email == "admin@example.com").first()
    
    if not admin:
        # Create default admin user
        admin = User(
            name="Admin User",
            email="admin@example.com",
            identity_document="ADMIN123456",
            is_admin=True
        )
        
        # Create login entry for admin
        admin_login = Login(user=admin)
        admin_login.set_password("admin123")  # Set a default password
        
        session.add(admin)
        session.add(admin_login)
        session.commit()
        print("✅ Default admin user created!")
    else:
        print("ℹ️ Admin user already exists.")
    
    session.close()

def seed_jobs_if_empty():
    """Seed some example jobs if jobs table is empty"""
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        count = session.query(Job).count()
        if count == 0:
            examples = [
                Job(title_job="Frontend Developer", description="React + TypeScript developer responsible for building UI features."),
                Job(title_job="Backend Engineer", description="Python/Flask engineer to build APIs and services."),
                Job(title_job="UX/UI Designer", description="Design user experiences and interfaces for web applications."),
            ]
            session.add_all(examples)
            session.commit()
            print("✅ Seeded example jobs")
        else:
            print("ℹ️ Jobs already present, skipping seed")
    except Exception as e:
        session.rollback()
        print(f"⚠️ Could not seed jobs: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    create_tables()
    create_admin_user()
    seed_jobs_if_empty()
    print("Database initialization completed.")