# api/routers/reports.py
from fastapi import APIRouter, HTTPException
from database import get_db_connection
from typing import List

router = APIRouter()

@router.get("/api/reports/top-products", tags=["Reports"])
def get_top_selling_products():
    """
    Obtiene un reporte de los productos más vendidos. Cumple con RF-78.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT p.name, SUM(od.quantity) as total_sold
            FROM order_details od
            JOIN products p ON od.product_id = p.product_id
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 10;
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        conn.close()


@router.get("/api/reports/promotions", tags=["Reports"])
def get_promotions_report():
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT p.name, COUNT(ap.promotion_id) as times_used, SUM(ap.discount_amount) as total_discount
            FROM applied_promotions ap
            JOIN promotions p ON ap.promotion_id = p.promotion_id
            GROUP BY p.name
            ORDER BY times_used DESC;
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

        
@router.get("/api/reports/cash-flow", tags=["Reports"])
def get_cash_flow_report(start_date: str, end_date: str):
    """
    Calcula el total de ventas agrupado por método de pago para un rango de fechas.
    Cumple con la base del requerimiento RF-61.
    """
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        # Suma los montos de la tabla 'payments' y los agrupa
        query = """
            SELECT payment_method, SUM(amount) as total_amount
            FROM payments
            WHERE DATE(payment_timestamp) BETWEEN %s AND %s
            GROUP BY payment_method;
        """
        cursor.execute(query, (start_date, end_date))
        return cursor.fetchall()
    except Exception as e:
        print(f"Error al generar el reporte de corte de caja: {e}")
        return []
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.get("/api/reports/daily-kpis", tags=["Reports"])
def get_daily_kpis():
    """
    Calcula y devuelve los Indicadores Clave de Rendimiento (KPIs) para el día actual.
    Cumple con el requerimiento RF-75.
    """
    conn = get_db_connection()
    if not conn:
        return {"total_sales": 0, "order_count": 0, "average_ticket": 0}
    try:
        cursor = conn.cursor(dictionary=True)

        # Consulta para obtener las ventas totales y el número de órdenes del día
        query = """
            SELECT
                SUM(amount) as total_sales,
                COUNT(DISTINCT order_id) as order_count
            FROM payments
            WHERE DATE(payment_timestamp) = CURDATE();
        """
        cursor.execute(query)
        result = cursor.fetchone()

        total_sales = result['total_sales'] if result['total_sales'] else 0
        order_count = result['order_count'] if result['order_count'] else 0

        # Calcula el ticket promedio, evitando la división por cero
        average_ticket = total_sales / order_count if order_count > 0 else 0

        return {
            "total_sales": total_sales,
            "order_count": order_count,
            "average_ticket": average_ticket
        }
    except Exception as e:
        print(f"Error al calcular KPIs diarios: {e}")
        return {"total_sales": 0, "order_count": 0, "average_ticket": 0}
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.get("/api/reports/profitability", tags=["Reports"])
def get_profitability_report():
    """
    Calcula la rentabilidad por producto.
    Cumple con el requerimiento RF-79.
    """
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        # Esta es una consulta compleja que une varias tablas para calcular la rentabilidad
        query = """
            SELECT
                p.name,
                COUNT(od.product_id) AS units_sold,
                p.price AS sale_price,
                SUM(p.price) AS total_revenue,
                (SELECT SUM(r.quantity_used * s.last_cost) FROM recipes r JOIN supplies s ON r.supply_id = s.supply_id WHERE r.product_id = p.product_id) AS recipe_cost,
                SUM((SELECT SUM(r.quantity_used * s.last_cost) FROM recipes r JOIN supplies s ON r.supply_id = s.supply_id WHERE r.product_id = p.product_id)) AS total_cost,
                (p.price - (SELECT SUM(r.quantity_used * s.last_cost) FROM recipes r JOIN supplies s ON r.supply_id = s.supply_id WHERE r.product_id = p.product_id)) AS profit_margin,
                SUM(p.price - (SELECT SUM(r.quantity_used * s.last_cost) FROM recipes r JOIN supplies s ON r.supply_id = s.supply_id WHERE r.product_id = p.product_id)) AS total_profit
            FROM order_details od
            JOIN products p ON od.product_id = p.product_id
            GROUP BY p.product_id, p.name, p.price
            ORDER BY total_profit DESC;
        """
        cursor.execute(query)
        return cursor.fetchall()
    except Exception as e:
        print(f"Error al generar el reporte de rentabilidad: {e}")
        return []
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.get("/api/reports/reservations-kpi", tags=["Reports"])
def get_reservations_kpi():
    """
    Calcula el KPI de reservaciones comparando el mes actual con el anterior.
    Cumple con el requerimiento RF-85.
    """
    conn = get_db_connection()
    if not conn: return {"current_month": 0, "previous_month": 0, "percentage_change": 0}
    try:
        cursor = conn.cursor(dictionary=True)
        # Cuenta las reservaciones confirmadas del mes actual
        query_current = "SELECT COUNT(*) as count FROM reservations WHERE status = 'Confirmada' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())"
        cursor.execute(query_current)
        current_month = cursor.fetchone()['count']

        # Cuenta las reservaciones confirmadas del mes anterior
        query_previous = "SELECT COUNT(*) as count FROM reservations WHERE status = 'Confirmada' AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)"
        cursor.execute(query_previous)
        previous_month = cursor.fetchone()['count']

        # Calcula el cambio porcentual
        if previous_month > 0:
            percentage_change = ((current_month - previous_month) / previous_month) * 100
        else:
            percentage_change = 100 if current_month > 0 else 0

        return {"current_month": current_month, "previous_month": previous_month, "percentage_change": percentage_change}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.get("/api/reports/waste-kpi", tags=["Reports"])
def get_waste_kpi():
    """
    Calcula el KPI de mermas comparando el mes actual con el anterior.
    Cumple con el requerimiento RF-86.
    """
    conn = get_db_connection()
    if not conn: return {"percentage_change": 0}
    try:
        cursor = conn.cursor(dictionary=True)
        # Suma el valor de las mermas del mes actual (asumiendo costo, simplificado a cantidad)
        query_current = "SELECT SUM(ABS(quantity_change)) as total FROM stock_movements WHERE movement_type LIKE 'Ajuste Merma' AND MONTH(movement_timestamp) = MONTH(CURDATE())"
        cursor.execute(query_current)
        current_waste = cursor.fetchone()['total'] or 0

        # Suma el valor de las mermas del mes anterior
        query_previous = "SELECT SUM(ABS(quantity_change)) as total FROM stock_movements WHERE movement_type LIKE 'Ajuste Merma' AND MONTH(movement_timestamp) = MONTH(CURDATE() - INTERVAL 1 MONTH)"
        cursor.execute(query_previous)
        previous_waste = cursor.fetchone()['total'] or 0

        if previous_waste > 0:
            percentage_change = ((current_waste - previous_waste) / previous_waste) * 100
        else:
            percentage_change = 100 if current_waste > 0 else 0

        return {"percentage_change": percentage_change}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.get("/api/reports/frequent-customers", tags=["Reports"])
def get_frequent_customers_report(start_date: str, end_date: str):
    """
    Genera un reporte de los clientes más frecuentes y con mayor gasto.
    Cumple con el requerimiento RF-146.
    """
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        # Esta consulta une clientes, órdenes y pagos para calcular las métricas
        query = """
            SELECT
                c.full_name,
                COUNT(DISTINCT o.order_id) AS visit_count,
                SUM(p.amount) AS total_spent
            FROM customers c
            JOIN orders o ON c.customer_id = o.customer_id
            JOIN payments p ON o.order_id = p.order_id
            WHERE o.status = 'Pagada' AND DATE(p.payment_timestamp) BETWEEN %s AND %s
            GROUP BY c.customer_id, c.full_name
            ORDER BY total_spent DESC;
        """
        cursor.execute(query, (start_date, end_date))
        return cursor.fetchall()
    except Exception as e:
        print(f"Error al generar reporte de clientes frecuentes: {e}")
        return []
    finally:
        if conn and conn.is_connected():
            conn.close()