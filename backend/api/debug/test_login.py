# test_login.py
import requests
import json
import time

API_URL = "https://portifolio-pj8c.onrender.com/api"

print("🔐 Testando login...")
print(f"📡 API URL: {API_URL}")
print("⏳ Aguardando resposta (pode levar alguns segundos no primeiro acesso)...")

start_time = time.time()

try:
    # Testar com YukiriDensuki (Y maiúsculo)
    response = requests.post(
        f"{API_URL}/auth/login",
        json={
            "username": "YukiriDensuki",
            "password": "yukiridensuki4175"
        },
        headers={"Content-Type": "application/json"},
        timeout=120  # 2 minutos de timeout
    )
    
    elapsed = time.time() - start_time
    print(f"⏱️ Tempo de resposta: {elapsed:.2f} segundos")
    print(f"\n📊 Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print("✅ Login realizado com sucesso!")
        print(f"👤 Usuário: {data['user']['username']}")
        print(f"📧 Email: {data['user']['email']}")
        print(f"🔑 Token: {data['token'][:50]}...")
        print(f"\n📝 Resposta completa:")
        print(json.dumps(data, indent=2))
    else:
        print("❌ Falha no login")
        print(f"📝 Resposta: {response.text}")

except requests.exceptions.Timeout:
    print("❌ Timeout: O servidor demorou muito para responder!")
    print("   Isso pode acontecer no primeiro acesso ao Render (cold start)")
except requests.exceptions.ConnectionError:
    print("❌ Erro de conexão: Não foi possível conectar ao servidor")
except Exception as e:
    print(f"❌ Erro inesperado: {e}")