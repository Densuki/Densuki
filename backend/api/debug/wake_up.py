# wake_up.py
import requests
import time
from datetime import datetime

API_URL = "https://portifolio-pj8c.onrender.com/api"

print("🔄 Despertando servidor...")

# Tentar várias vezes
for i in range(3):
    try:
        print(f"Tentativa {i+1}/3...")
        response = requests.get(f"{API_URL}/health", timeout=60)
        print(f"✅ Servidor respondeu! Status: {response.status_code}")
        break
    except Exception as e:
        print(f"⏳ Aguardando... ({i+1}/3)")
        time.sleep(10)