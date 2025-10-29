# api/hash_pin.py
from passlib.context import CryptContext

# Usa la misma configuración que tu app
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# El PIN que queremos usar
pin_to_hash = "1234"

# Genera el hash
hashed_pin = pwd_context.hash(pin_to_hash)

print("\n--- ¡Hash de PIN Generado! ---")
print("Este hash es 100% compatible con tu sistema.")
print("\n1. Copia la siguiente línea de hash completa:")
print(hashed_pin)
print("\n2. Pégala en el comando SQL de abajo y ejecútalo en tu base de datos.\n")