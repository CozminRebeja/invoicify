# backend/tests/conftest.py
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import Client, Invoice, ServiceItem
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

@pytest.fixture(scope='function') 
def test_app():

    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture(scope='function')
def test_client(test_app):

    return test_app.test_client()

@pytest.fixture(scope='function')
def init_database(test_app):
    with test_app.app_context():
        yield db
