"""
Script para deletar o usuário ellencosta2@gmail.com e a empresa vinculada.
Execute este script UMA VEZ no servidor após o deploy:
  python delete_ellen.py
"""
import sqlite3
import os
import sys

# Detecta o caminho correto do banco master
# No Railway com volume: /data/database_master.db
# Local: backend/database_master.db
paths_to_try = [
    "/data/database_master.db",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "database_master.db"),
]

db_path = None
for p in paths_to_try:
    if os.path.exists(p):
        db_path = p
        break

if not db_path:
    print("ERRO: Banco database_master.db não encontrado nos caminhos:", paths_to_try)
    sys.exit(1)

print(f"Conectando em: {db_path}")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. Buscar usuário
cur.execute("SELECT id, nome, email, cnpj_empresa FROM usuario WHERE email = 'ellencosta2@gmail.com'")
user = cur.fetchone()

if not user:
    print("Usuário ellencosta2@gmail.com NÃO encontrado no banco. Nada a deletar.")
    conn.close()
    sys.exit(0)

user_id, nome, email, cnpj = user
print(f"Usuário encontrado: ID={user_id}, Nome={nome}, Email={email}, CNPJ={cnpj}")

# 2. Deletar usuário
cur.execute("DELETE FROM usuario WHERE email = 'ellencosta2@gmail.com'")
print(f"✅ Usuário '{email}' deletado.")

# 3. Deletar empresa vinculada (se existir)
if cnpj:
    cur.execute("SELECT id, nome FROM empresa WHERE cnpj = ?", (cnpj,))
    emp = cur.fetchone()
    if emp:
        cur.execute("DELETE FROM empresa WHERE cnpj = ?", (cnpj,))
        print(f"✅ Empresa '{emp[1]}' (CNPJ: {cnpj}) deletada.")
    else:
        print(f"Empresa com CNPJ '{cnpj}' não encontrada (pode já ter sido removida).")
else:
    print("Usuário não tinha CNPJ vinculado. Nenhuma empresa a deletar.")

conn.commit()
conn.close()
print("\nOperação concluída com sucesso!")
print("O usuário pode agora se recadastrar com um novo CNPJ.")
