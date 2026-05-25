from run import create_app
from database import db
from database.models import User  # <-- The crucial fix! Looking in the database folder.

# Initialize the Flask app context
app = create_app()

with app.app_context():
    # 1. Create the database tables if they don't exist
    db.create_all()
    
    # 2. Check if the admin already exists
    admin_email = "doctor@nephroai.com"
    existing_user = User.query.filter_by(email=admin_email).first()
    
    if existing_user:
        print(f"✅ User '{admin_email}' already exists in the database!")
    else:
        # 3. Create a new User object
        new_admin = User(email=admin_email, name="Dr. Admin")
        
        # 4. Hash the password securely!
        new_admin.set_password("password123") 
        
        # 5. Save to database
        db.session.add(new_admin)
        db.session.commit()
        print(f"🎉 Success! Secure admin created: {admin_email} | Password: password123")