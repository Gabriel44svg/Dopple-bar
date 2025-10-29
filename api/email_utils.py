# api/email_utils.py
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv

load_dotenv()

# La función ahora acepta dos nuevos parámetros opcionales para los adjuntos
def send_email(to_email, subject, body, attachment_content=None, attachment_filename=None):
    sender_email = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")

    if not sender_email or not password:
        print("Error: Credenciales de email no configuradas en .env")
        return

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    # --- NUEVA LÓGICA PARA ARCHIVOS ADJUNTOS ---
    if attachment_content and attachment_filename:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment_content.encode('utf-8'))
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition",
            f"attachment; filename= {attachment_filename}",
        )
        message.attach(part)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, to_email, message.as_string())
        print(f"Email enviado exitosamente a {to_email}")
    except Exception as e:
        print(f"Error al enviar el email: {e}")
    finally:
        if 'server' in locals() and server:
            server.quit()