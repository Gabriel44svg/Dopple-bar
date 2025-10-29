# api/model_trainer.py (Versión de Depuración)
import pandas as pd
from database import get_db_connection
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

def train_demand_model():
    print("--- INICIO DEL SCRIPT DE ENTRENAMIENTO ---")
    print("Paso 1: Intentando conectar a la base de datos...")
    conn = get_db_connection()
    if not conn:
        print(">>> ERROR: La conexión a la base de datos falló. El script se detendrá.")
        return

    print("Paso 2: Conexión exitosa. Ejecutando consulta SQL...")
    try:
        query = """
            SELECT DATE(created_at) as date, COUNT(order_id) as daily_orders
            FROM orders
            WHERE status = 'Pagada'
            GROUP BY DATE(created_at)
            ORDER BY date;
        """
        df = pd.read_sql(query, conn)
        print(f"Paso 3: Consulta completada. Se encontraron {len(df)} días con ventas pagadas.")

        if len(df) < 10:
            print(">>> ERROR: No hay suficientes datos para entrenar (se necesitan al menos 10). El script se detendrá.")
            return

        print("Paso 4: Datos suficientes. Preparando datos para el modelo...")
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        X = df[['day_of_week']]
        y = df['daily_orders']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        print("Paso 5: Construyendo la red neuronal...")
        model = Sequential([
            Dense(10, activation='relu', input_shape=[1]),
            Dense(10, activation='relu'),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mean_squared_error')

        print("Paso 6: Entrenando el modelo... (esto puede tardar un momento)")
        model.fit(X_train, y_train, epochs=50, verbose=0)

        print("Paso 7: Entrenamiento completado. Guardando modelo...")
        model.save('demand_model.h5')
        print("--- FIN: Modelo guardado como 'demand_model.h5' ---")

    except Exception as e:
        print(f">>> Ocurrió un error inesperado: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()
            print("Conexión a la base de datos cerrada.")

# Ejecuta la función principal
if __name__ == '__main__':
    train_demand_model()