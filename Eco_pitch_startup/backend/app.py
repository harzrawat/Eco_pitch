from flask import Flask
from backend.config import Config
from backend.extensions import db, jwt, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints or routes here
    from backend.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    @app.route('/health')
    def health_check():
        return {'status': 'ok', 'project': 'SkillXchange'}

    return app

if __name__ == '__main__':
    app = create_app()
    app.run()
