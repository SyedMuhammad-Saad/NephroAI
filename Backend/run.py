from flask import Flask
from flask_cors import CORS
from api.auth_routes import auth_bp

# Import our settings and database
from config import Config
from database import db

# Import our Traffic Cops (Blueprints)
from api.patient_routes import patient_bp
from api.diagnose_routes import diagnose_bp

def create_app():
    # 1. Create the Flask app
    app = Flask(__name__)
    
    # 2. Load the configuration
    app.config.from_object(Config)
    
    # 3. Enable React to talk to Flask
    CORS(app)
    
    # 4. Plug the database into the app
    db.init_app(app)
    
    # 5. Plug in the Routes
    app.register_blueprint(patient_bp)
    app.register_blueprint(diagnose_bp)
    app.register_blueprint(auth_bp)
    
    # 6. Make sure the database tables exist
    with app.app_context():
        db.create_all()
        print("✅ Enterprise Database Linked and Ready!")
        
    return app

# Turn the server on!
if __name__ == '__main__':
    app = create_app()
    print("🚀 Starting Modular Flask Server on http://localhost:5000...")
    app.run(debug=True, port=5000)