"""
wsgi.py — Adaptador para PythonAnywhere Free Tier (WSGI)
=========================================================
O PythonAnywhere gratuito só aceita WSGI. Este arquivo usa a biblioteca
a2wsgi para envolver o FastAPI (que é ASGI) num wrapper WSGI compatível.

Na configuração do PythonAnywhere, aponte o campo "WSGI configuration file"
para este arquivo e defina o source directory como: /home/SEU_USER/erp_Prod/backend
"""
import sys
import os

# Adiciona o diretório do backend ao PYTHONPATH
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THIS_DIR)

# Define variáveis de ambiente de produção antes de importar o app
os.environ.setdefault("ENV", "production")

from a2wsgi import ASGIMiddleware
from app.main import app as fastapi_app  # noqa

# 'application' é o nome que o PythonAnywhere espera
application = ASGIMiddleware(fastapi_app)
