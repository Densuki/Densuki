# keep_alive.py
import requests
import time
from datetime import datetime

API_URL = "https://portifolio-pj8c.onrender.com/api"

def ping_server():
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        if response.status_code == 200:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✅ Servidor online")
        else:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ⚠️ Servidor respondeu com status {response.status_code}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Erro: {e}")

if __name__ == "__main__":
    print("🔄 Mantendo servidor ativo...")
    while True:
        ping_server()
        time.sleep(300)  # 5 minutos