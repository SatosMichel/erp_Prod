import os
import sys

# Define o caminho absoluto para o diretório backend do seu projeto no PythonAnywhere.
# Substitua 'seu_usuario' pelo seu nome de usuário real no PythonAnywhere.
project_home = '/home/seu_usuario/erp_Prod/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# O WSGI precisa rodar neste diretório para achar os bancos de dados relativos.
os.chdir(project_home)

# Importa as dependências (certifique-se de ter rodado pip install a2wsgi no console deles)
from a2wsgi import ASGIMiddleware
from app.main import app as fastapi_app

# A variável "application" é a mágica do WSGI.
# O PythonAnywhere vai procurar essa variável para rodar o seu servidor.
# O ASGIMiddleware atua como um "tradutor" do nosso FastAPI moderno para o servidor deles.
application = ASGIMiddleware(fastapi_app)
