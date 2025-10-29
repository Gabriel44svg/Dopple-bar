import { useState, useEffect, useRef } from "react";
import "./AdminChat.css";

function AdminChat() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_admin");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(true);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chat_admin", JSON.stringify(messages));
  }, [messages]);

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/chat/admin");
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ Conectado al chat Admin");
    ws.onmessage = (e) => setMessages((prev) => [...prev, e.data]);
    ws.onclose = () => {
      console.warn("⚠️ Conexión Admin cerrada, reintentando...");
      reconnectRef.current = setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = (err) => {
      console.error("❌ Error WebSocket Admin:", err);
      ws.close();
    };
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectRef.current);
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(input);
      setMessages((prev) => [...prev, "Tú: " + input]);
      setInput("");
    }
  };

  return (
    <>
      {isMinimized ? (
        <div className="admin-minimized" onClick={() => setIsMinimized(false)}>
          <div className="admin-minimized-content">
            <span className="admin-icon">💬</span>
            <span className="admin-text">Admin</span>
          </div>
        </div>
      ) : (
        <div className="admin-chat-container">
          <div className="admin-header">
            Chat Admin
            <button className="close-btn" onClick={() => setIsMinimized(true)}>✕</button>
          </div>
          <div className="admin-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className="admin-msg">{msg}</div>
            ))}
          </div>
          <div className="admin-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe un mensaje..."
            />
            <button onClick={sendMessage}>Enviar</button>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminChat;
