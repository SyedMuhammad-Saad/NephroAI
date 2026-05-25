from flask import Blueprint, request, jsonify
from database import models
from database import db
from sqlalchemy import or_ # This lets us search by Name OR MRN
# The two dots (..) tell Python to go up one folder to find models.py
from database.models import Patient
from database.models import DiagnosticRecord 
from database.models import db
import google.generativeai as genai
import os
from services.ml_predictor import safe_float, predict_ckd_risk
from services.image_predictor import analyze_medical_scan
import numpy as np

diagnose_bp = Blueprint('diagnose_bp', __name__)

@diagnose_bp.route('/api/diagnose', methods=['POST'])
def run_diagnostics():
    print("\n--- NEW DIAGNOSTIC REQUEST RECEIVED (Blood + Scan) ---")
    patient_id = request.form.get('patientId')
    
    # Catch all 21 features
    sex = safe_float(request.form.get('Sex'))
    age = safe_float(request.form.get('Age'))
    haemoglobin = safe_float(request.form.get('Haemoglobin'))
    hematocrit = safe_float(request.form.get('Hematocrit'))
    lymphocytes = safe_float(request.form.get('Lymphocytes'))
    mch = safe_float(request.form.get('MCH'))
    mchc = safe_float(request.form.get('MCHC'))
    mcv = safe_float(request.form.get('MCV'))
    monocytes = safe_float(request.form.get('Monocytes'))
    mpv = safe_float(request.form.get('MPV'))
    pct = safe_float(request.form.get('PCT'))
    pdw = safe_float(request.form.get('PDW'))
    platelet_count = safe_float(request.form.get('PlateletCount'))
    polymorphs = safe_float(request.form.get('Polymorphs'))
    rbc_count = safe_float(request.form.get('RBCCount'))
    rdwsd = safe_float(request.form.get('RDWSD'))
    wbc_count = safe_float(request.form.get('WBCCount'))
    eosinophils = safe_float(request.form.get('Eosinophils'))
    creatinine = safe_float(request.form.get('Creatinine'))
    urea = safe_float(request.form.get('Urea'))
    gfr = safe_float(request.form.get('GFR'))

    try:
        input_data = np.array([[
            sex, age, haemoglobin, hematocrit, lymphocytes,
            mch, mchc, mcv, monocytes, mpv, pct, pdw,
            platelet_count, polymorphs, rbc_count, rdwsd,
            wbc_count, eosinophils, creatinine, urea, gfr
        ]])

        # 1. RUN THE MAIN RISK SCORE (From ml_predictor)
        from services.ml_predictor import scaler # Import the scaler to squish the data
        scaled_input = scaler.transform(input_data)
        
        real_risk_score = predict_ckd_risk(input_data)
        print(f"🧠 AI Risk Calculation Complete: {real_risk_score}%")

        # 2. RUN THE SHAP EXPLAINER
        from services.shap_explainer import generate_shap_explanation
        shap_explanation = generate_shap_explanation(scaled_input)
        print(f"🔍 SHAP Explanation Generated!")
        
        # 3. RUN THE DICE COUNTERFACTUAL ENGINE
        from services.counterfactuals import generate_counterfactual_plan 
        
        patient_dict = {
            "Sex": sex, "Age": age, "Haemoglobin": haemoglobin, "Hematocrit": hematocrit,
            "Lymphocytes": lymphocytes, "MCH": mch, "MCHC": mchc, "MCV": mcv,
            "Monocytes": monocytes, "MPV": mpv, "PCT": pct, "PDW": pdw,
            "PlateletCount": platelet_count, "Polymorphs": polymorphs,
            "RBCCount": rbc_count, "RDWSD": rdwsd, "WBCCount": wbc_count,
            "Eosinophils": eosinophils, "Creatinine": creatinine, "Urea": urea, "GFR": gfr
        }
        
        is_patient_healthy = real_risk_score < 50
        print(f"🧬 Running DiCE Simulation (Healthy Status: {is_patient_healthy})...")
        dice_recommendations = generate_counterfactual_plan(patient_dict, is_patient_healthy)
        
        # 4. RUN THE PATIENT SIMILARITY ENGINE
        from services.similarity import find_similar_patients
        historical_cohort = find_similar_patients(scaled_input, real_risk_score, top_k=3)
        print("🔍 Patient Similarity Cohort Generated!")

        # ---------------------------------------------------------
        # 5. NEW: RUN THE PYTORCH IMAGE AI
        # ---------------------------------------------------------
        from services.image_predictor import analyze_medical_scan
        
        image_file = request.files.get('image') # Catch what React sent!
        image_analysis_result = None
        
        if image_file and image_file.filename != '':
            print(f"📸 Processing Medical Scan: {image_file.filename}...")
            image_analysis_result = analyze_medical_scan(image_file)
        else:
            print("ℹ️ No image provided in this diagnostic run.")
        # ---------------------------------------------------------

       
        # 6. SAVE TO DATABASE
        if patient_id:
            try:
                new_record = DiagnosticRecord(
                    patient_id=int(patient_id),
                    age=age,                      # <-- Added missing age
                    sex=sex,                      # <-- Added missing sex
                    haemoglobin=haemoglobin,
                    hematocrit=hematocrit,
                    lymphocytes=lymphocytes,
                    mch=mch,
                    mchc=mchc,
                    mcv=mcv,
                    monocytes=monocytes,
                    mpv=mpv,
                    pct=pct,
                    pdw=pdw,
                    platelet_count=platelet_count,
                    polymorphs=polymorphs,
                    rbc_count=rbc_count,
                    rdwsd=rdwsd,
                    wbc_count=wbc_count,
                    eosinophils=eosinophils,
                    creatinine=creatinine,
                    urea=urea,
                    gfr=gfr,
                    risk_score=float(real_risk_score)  # <-- Exact column name!
                )
                
                db.session.add(new_record)
                db.session.commit()
                print(f"💾 Successfully saved record for Patient ID: {patient_id}")
            except Exception as db_err:
                db.session.rollback()
                print(f"❌ Error saving to database: {db_err}")


        # 7. SEND THE MASSIVE PAYLOAD BACK TO REACT!
        return jsonify({
            "status": "success",
            "message": "AI Diagnostics Complete",
            "riskScore": real_risk_score,
            "shapData": shap_explanation,
            "counterfactuals": dice_recommendations,
            "similarPatients": historical_cohort,
            "imageAnalysis": image_analysis_result  # <-- PyTorch data attached here!
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
    # ==========================================
    # =================================================================
# GEMINI CHATBOT ROUTE
# =================================================================

# 1. SETUP GEMINI (Please regenerate your key in Google AI Studio after your project is done!)
os.environ["GOOGLE_API_KEY"] = "AIzaSyCB2tv03YR8aRkYc1ILVNzIIS8vh9PqsL4" 
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Initialize the model
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# Notice we are using diagnose_bp here to match your other routes!
@diagnose_bp.route('/api/chat', methods=['POST'])
def chat_route():
    try:
        data = request.json
        user_message = data.get('message')
        
        # We catch the patient data sent from React so Gemini knows who it is talking about!
        patient_context = data.get('context', 'No patient context provided.')
        
        # 2. BUILD THE PROMPT
        system_prompt = f"""
        You are NephroAI, a specialized Medical AI Consultant. 
        Maintain this context for our conversation.
        
        PATIENT CONTEXT FROM DASHBOARD:
        {patient_context}
        
        Please answer the doctor's question professionally based strictly on this diagnostic data.
        """
        
        # 3. START CHAT & GET RESPONSE
        chat = gemini_model.start_chat(history=[])
        
        # We silently pass the patient data first so Gemini has the context
        chat.send_message(system_prompt)
        
        # Then we send the actual question the doctor typed
        response = chat.send_message(user_message)
        
        return jsonify({"reply": response.text}), 200

    except Exception as e:
        print(f"Chatbot Error: {e}")
        return jsonify({"reply": "I'm sorry, I am having trouble connecting to the AI brain right now."}), 500
    
## API FOR DOCTORS SEARCH

@diagnose_bp.route('/api/patients/search', methods=['GET'])
def search_patients():
    try:
        # 1. Get the search word the doctor typed (e.g., ?q=Marcus)
        search_term = request.args.get('q', '').strip()
        
        # If they haven't typed anything yet, return an empty list
        if not search_term:
            return jsonify({"success": True, "patients": []}), 200
            
        # 2. Search the database for matching Names OR matching MRNs
        # The 'ilike' and '%' symbols mean it will match partial words (e.g., "Mar" finds "Marcus")
        search_results = Patient.query.filter(
            or_(
                Patient.name.ilike(f'%{search_term}%'),
                Patient.mrn.ilike(f'%{search_term}%')
            )
        ).limit(10).all() # Only grab the top 10 results so it stays fast
        
        # 3. Format the results cleanly for React
        patients_data = []
        for p in search_results:
            patients_data.append({
                "id": p.id,
                "name": p.name,
                "mrn": p.mrn,
                "age": p.age,
                "sex": p.sex
            })
            
        return jsonify({"success": True, "patients": patients_data}), 200

    except Exception as e:
        print(f"Error searching patients: {e}")
        return jsonify({"success": False, "error": "Failed to search patients."}), 500
    from ..models import DiagnosticRecord # Ensure this import is at the top of your file!

@diagnose_bp.route('/api/patients/<int:patient_id>/latest', methods=['GET'])
def get_latest_record(patient_id):
    try:
        # Sort by date descending to grab the absolute newest test
        latest_record = DiagnosticRecord.query.filter_by(patient_id=patient_id).order_by(DiagnosticRecord.date_tested.desc()).first()
        
        # If this is a brand new patient with no tests yet, just return false safely
        if not latest_record:
            return jsonify({"success": True, "has_record": False}), 200
            
        # We safely map the database columns to exactly match your React formData keys.
        # (getattr is a safe way to check for column names in case you used lowercase or uppercase in your DB!)
        record_data = {
            "Haemoglobin": getattr(latest_record, 'haemoglobin', getattr(latest_record, 'Haemoglobin', '')),
            "Hematocrit": getattr(latest_record, 'hematocrit', getattr(latest_record, 'Hematocrit', '')),
            "Lymphocytes": getattr(latest_record, 'lymphocytes', getattr(latest_record, 'Lymphocytes', '')),
            "MCH": getattr(latest_record, 'mch', getattr(latest_record, 'MCH', '')),
            "MCHC": getattr(latest_record, 'mchc', getattr(latest_record, 'MCHC', '')),
            "MCV": getattr(latest_record, 'mcv', getattr(latest_record, 'MCV', '')),
            "Monocytes": getattr(latest_record, 'monocytes', getattr(latest_record, 'Monocytes', '')),
            "MPV": getattr(latest_record, 'mpv', getattr(latest_record, 'MPV', '')),
            "PCT": getattr(latest_record, 'pct', getattr(latest_record, 'PCT', '')),
            "PDW": getattr(latest_record, 'pdw', getattr(latest_record, 'PDW', '')),
            "PlateletCount": getattr(latest_record, 'platelet_count', getattr(latest_record, 'PlateletCount', '')),
            "Polymorphs": getattr(latest_record, 'polymorphs', getattr(latest_record, 'Polymorphs', '')),
            "RBCCount": getattr(latest_record, 'rbc_count', getattr(latest_record, 'RBCCount', '')),
            "RDWSD": getattr(latest_record, 'rdwsd', getattr(latest_record, 'RDWSD', '')),
            "WBCCount": getattr(latest_record, 'wbc_count', getattr(latest_record, 'WBCCount', '')),
            "Eosinophils": getattr(latest_record, 'eosinophils', getattr(latest_record, 'Eosinophils', '')),
            "Creatinine": getattr(latest_record, 'creatinine', getattr(latest_record, 'Creatinine', '')),
            "Urea": getattr(latest_record, 'urea', getattr(latest_record, 'Urea', '')),
            "GFR": getattr(latest_record, 'gfr', getattr(latest_record, 'GFR', ''))
        }
        
        return jsonify({"success": True, "has_record": True, "data": record_data}), 200

    except Exception as e:
        print(f"Error fetching latest record: {e}")
        return jsonify({"success": False, "error": "Failed to retrieve history."}), 500
    
  
        # --- NEW: DASHBOARD STATS ROUTE ---
# --- UPGRADED: DASHBOARD STATS & RECENT ACTIVITY ROUTE ---
# --- UPGRADED: DASHBOARD STATS & RECENT ACTIVITY ROUTE ---
# --- UPGRADED: DASHBOARD STATS & RECENT ACTIVITY ROUTE ---
@diagnose_bp.route('/api/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # 1. Card Stats
        total_patients = Patient.query.count()
        total_scans = DiagnosticRecord.query.count()
        critical_alerts = DiagnosticRecord.query.filter(DiagnosticRecord.risk_score >= 70).count()
        
        # 2. Fetch the 5 most recent records
        # Using .id.desc() ensures we get the most recent ones without crashing
        recent_records = DiagnosticRecord.query.order_by(DiagnosticRecord.id.desc()).limit(5).all()
        
        recent_activity = []
        for record in recent_records:
            patient = Patient.query.get(record.patient_id)
            if patient:
                status = "Stable"
                if record.risk_score >= 70:
                    status = "Critical"
                elif record.risk_score >= 30:
                    status = "Review"
                
                # Check for existing date/timestamp fields. 
                # Change 'timestamp' below to 'created_at' or 'date' if you find those in models.py
                display_date = "N/A"
                if hasattr(record, 'timestamp'):
                    display_date = record.timestamp.strftime("%b %d, %Y")
                elif hasattr(record, 'created_at'):
                    display_date = record.created_at.strftime("%b %d, %Y")
                    
                recent_activity.append({
                    "id": record.id,
                    "name": patient.name,
                    "mrn": patient.mrn,
                    "date": display_date,
                    "risk": round(record.risk_score, 1) if record.risk_score else 0,
                    "status": status,
                    "patient_data": {
                        "id": patient.id,
                        "name": patient.name,
                        "mrn": patient.mrn,
                        "age": patient.age,
                        "sex": patient.sex
                    }
                })
        
        return jsonify({
            "success": True,
            "total_patients": total_patients,
            "total_scans": total_scans,
            "critical_alerts": critical_alerts,
            "recent_activity": recent_activity
        })
    except Exception as e:
        import traceback
        print(f"Error fetching stats: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500