from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(app)

    from app.routes import main_bp
    app.register_blueprint(main_bp, url_prefix='/api')

    # Test route
    @app.route('/hello')
    def hello():
        return "Hello from Backend!"

    return app