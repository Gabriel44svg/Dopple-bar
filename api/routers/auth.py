# api/routers/auth.py
from fastapi import APIRouter, HTTPException, Request, Depends, status
from pydantic import BaseModel
from passlib.context import CryptContext
from database import get_db_connection
import datetime
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Configuración de Seguridad para JWT (RF-33) ---
SECRET_KEY = "un_secreto_muy_dificil_de_adivinar_cambiar_en_produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

# --- Política de Bloqueo de Cuentas (RF-32) ---
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

# --- Modelos de Datos ---
class UserLogin(BaseModel):
    email: str
    password: str

class TokenData(BaseModel):
    email: str | None = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# --- Funciones Auxiliares ---
def create_access_token(data: dict, expires_delta: datetime.timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM users WHERE email = %s AND is_active = 1"
        cursor.execute(query, (token_data.email,))
        user = cursor.fetchone()
        if user is None:
            raise credentials_exception
        return user
    finally:
        if conn and conn.is_connected():
            conn.close()

async def get_user_from_token(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM users WHERE email = %s AND is_active = 1"
        cursor.execute(query, (token_data.email,))
        user = cursor.fetchone()
        if user is None:
            raise credentials_exception
        return user
    finally:
        if conn and conn.is_connected():
            conn.close()

# --- Endpoint de Login ---
@router.post("/api/login", tags=["Authentication"])
def login(user_credentials: UserLogin, request: Request):
    """
    Maneja el inicio de sesión y registra cada intento.
    Cumple con RF-31, RF-32, RF-33 y RF-96.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")

    client_ip = request.client.host  # <-- IP del cliente

    try:
        cursor = conn.cursor(dictionary=True)
        # Obtiene usuario activo
        query = "SELECT * FROM users WHERE email = %s AND is_active = 1"
        cursor.execute(query, (user_credentials.email,))
        user = cursor.fetchone()

        # Usuario no encontrado o contraseña incorrecta
        if not user or not pwd_context.verify(user_credentials.password, user["password_hash"]):
            # Registrar intento fallido (RF-96)
            log_query = "INSERT INTO login_attempts (email_used, ip_address, was_successful) VALUES (%s, %s, 0)"
            cursor.execute(log_query, (user_credentials.email, client_ip))

            if user:
                # Incrementar intentos fallidos y bloquear si excede MAX_FAILED_ATTEMPTS (RF-32)
                new_attempts = user["failed_login_attempts"] + 1
                if new_attempts >= MAX_FAILED_ATTEMPTS:
                    lockout_time = datetime.datetime.now() + datetime.timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                    cursor.execute(
                        "UPDATE users SET failed_login_attempts = %s, lockout_until = %s WHERE user_id = %s",
                        (new_attempts, lockout_time, user["user_id"])
                    )
                else:
                    cursor.execute(
                        "UPDATE users SET failed_login_attempts = %s WHERE user_id = %s",
                        (new_attempts, user["user_id"])
                    )

            conn.commit()
            raise HTTPException(status_code=401, detail="Email o contraseña incorrectos.")

        # Revisar si la cuenta está bloqueada (RF-32)
        if user["lockout_until"] and user["lockout_until"] > datetime.datetime.now():
            raise HTTPException(status_code=403, detail="Cuenta bloqueada. Intenta de nuevo más tarde.")

        # Registrar intento exitoso (RF-96)
        log_query = "INSERT INTO login_attempts (email_used, ip_address, was_successful) VALUES (%s, %s, 1)"
        cursor.execute(log_query, (user_credentials.email, client_ip))

        # Resetear contador de fallos
        if user["failed_login_attempts"] > 0 or user["lockout_until"] is not None:
            cursor.execute(
                "UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE user_id = %s",
                (user["user_id"],)
            )

        conn.commit()

        # Crear token de acceso
        access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "user_id": user["user_id"], "role_id": user["role_id"]},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user["user_id"],
                "full_name": user["full_name"],
                "role_id": user["role_id"]
            }
        }
    finally:
        if conn and conn.is_connected():
            conn.close()