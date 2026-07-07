# test_health.py
import requests
import time

API_URL = "https://portifolio-pj8c.onrender.com/api"

print("🏥 Testando health check...")
print(f"📡 URL: {API_URL}/health")

start = time.time()

try:
    response = requests.get(f"{API_URL}/health", timeout=30)
    elapsed = time.time() - start
    
    print(f"⏱️ Tempo: {elapsed:.2f}s")
    print(f"📊 Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Servidor online!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Erro: {response.text}")
        
except requests.exceptions.Timeout:
    print("❌ Timeout: O servidor não respondeu em 30 segundos")
except Exception as e:
    print(f"❌ Erro: {e}")