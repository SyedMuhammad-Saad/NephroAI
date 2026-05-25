from flask import Blueprint, request, jsonify
from database.models import User

# Create a new blueprint (Traffic Cop) for authentication
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        # 1. Get the data React sent us
        data = request.json
        email = data.get('email')
        password = data.get('password')

        # 2. Look for the user in the database
        user = User.query.filter_by(email=email).first()

        # 3. Check if the user exists AND the password is correct
        if user and user.check_password(password):
            return jsonify({
                "success": True, 
                "message": "Login successful!",
                "user": {"name": user.name, "email": user.email}
            }), 200
        else:
            # If it fails, send an unauthorized error
            return jsonify({
                "success": False, 
                "message": "Invalid email or password. Please try again."
            }), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"success": False, "message": "Server error during login"}), 500