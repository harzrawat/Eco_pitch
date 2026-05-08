from backend.app import create_app
from backend.extensions import db

app = create_app()

with app.app_context():
    print("Connecting to database...")
    db.create_all()
    print("Success: Tables created successfully!")
