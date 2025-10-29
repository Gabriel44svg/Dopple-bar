import pandas as pd
from database import get_db_connection

def create_sales_dataset():
    """
    Recolecta datos de ventas y los exporta a un CSV para entrenamiento.
    Implementación conceptual de RF-129.
    """
    conn = get_db_connection()
    if not conn:
        print("No se pudo conectar a la base de datos.")
        return

    try:
        # Una consulta SQL que une ventas, detalles y productos
        query = """
            SELECT
                o.order_id,
                o.created_at AS sale_date,
                p.name AS product_name,
                od.quantity,
                od.price_at_time_of_order AS price
            FROM orders o
            JOIN order_details od ON o.order_id = od.order_id
            JOIN products p ON od.product_id = p.product_id
            WHERE o.status = 'Pagada';
        """
        
        # Usamos la librería pandas para manejar los datos fácilmente
        df = pd.read_sql(query, conn)
        
        # Limpieza y transformación (ejemplo)
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        df['day_of_week'] = df['sale_date'].dt.day_name()
        
        # Exportar a CSV
        df.to_csv('sales_dataset.csv', index=False)
        
        print("Dataset de ventas creado exitosamente: sales_dataset.csv")
        
    except Exception as e:
        print(f"Error al crear el dataset: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

# Para ejecutarlo, simplemente llamarías a la función:
# create_sales_dataset()