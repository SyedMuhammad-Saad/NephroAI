from flask import Blueprint, request, jsonify
from database import db
from database.models import Patient

# Create a "Blueprint" for patient-related traffic
patient_bp = Blueprint('patient_bp', __name__)

@patient_bp.route('/api/patients', methods=['POST'])
def register_patient():
    print("\n--- NEW PATIENT REGISTRATION REQUEST ---")
    data = request.json
    
    name = data.get('name')
    mrn = data.get('mrn')
    age = data.get('age')
    sex = data.get('sex')
    
    if not all([name, mrn, age, sex is not None]):
        return jsonify({"status": "error", "message": "Missing required patient fields"}), 400

    try:
        existing_patient = Patient.query.filter_by(mrn=mrn).first()
        if existing_patient:
            return jsonify({"status": "error", "message": f"Patient with MRN {mrn} already exists!"}), 409

        new_patient = Patient(name=name, mrn=mrn, age=int(age), sex=int(sex))
        db.session.add(new_patient)
        db.session.commit()
        
        print(f"✅ Patient {name} (MRN: {mrn}) saved to database!")
        return jsonify({
            "status": "success", 
            "message": "Patient registered successfully",
            "patient_id": new_patient.id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Database Error: {e}")
        return jsonify({"status": "error", "message": "Failed to save patient."}), 500