import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# Asegúrate de que esta función exista tal cual
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Error de conexión: {err}")
        return None