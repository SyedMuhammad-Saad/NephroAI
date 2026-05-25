from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database import db

# ==========================================
# 1. The Patient Table
# ==========================================
class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mrn = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    sex = db.Column(db.Integer, nullable=False)
    date_registered = db.Column(db.DateTime, default=datetime.utcnow)

# ==========================================
# 2. The Upgraded AI Results Table (21 Features)
# ==========================================
class DiagnosticRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    risk_score = db.Column(db.Integer, nullable=False)
    
    # The 21 Clinical Features
    age = db.Column(db.Float)
    sex = db.Column(db.Float)
    haemoglobin = db.Column(db.Float)
    hematocrit = db.Column(db.Float)
    lymphocytes = db.Column(db.Float)
    mch = db.Column(db.Float)
    mchc = db.Column(db.Float)
    mcv = db.Column(db.Float)
    monocytes = db.Column(db.Float)
    mpv = db.Column(db.Float)
    pct = db.Column(db.Float)
    pdw = db.Column(db.Float)
    platelet_count = db.Column(db.Float)
    polymorphs = db.Column(db.Float)
    rbc_count = db.Column(db.Float)
    rdwsd = db.Column(db.Float)
    wbc_count = db.Column(db.Float)
    eosinophils = db.Column(db.Float)
    creatinine = db.Column(db.Float)
    urea = db.Column(db.Float)
    gfr = db.Column(db.Float)

    date_tested = db.Column(db.DateTime, default=datetime.utcnow)
    patient = db.relationship('Patient', backref=db.backref('records', lazy=True))

    # --- USER AUTHENTICATION MODEL ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    # This function scrambles the password before saving it
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # This function checks if a typed password matches the scrambled one
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)