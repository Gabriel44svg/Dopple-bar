import { useState, useEffect, useRef } from "react";
import "./ChatBarra.css";

function ChatBarra() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_barra");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(true);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chat_barra", JSON.stringify(messages));
  }, [messages]);

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/chat/barra");
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ Conectado al chat Barra");
    ws.onmessage = (e) => setMessages((prev) => [...prev, e.data]);
    ws.onclose = () => {
      console.warn("⚠️ Conexión Barra cerrada, reintentando...");
      reconnectRef.current = setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = (err) => {
      console.error("❌ Error WebSocket Barra:", err);
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
        <div className="barra-minimized" onClick={() => setIsMinimized(false)}>
          <div className="barra-minimized-content">
            <span className="barra-icon">🍹</span>
            <span className="barra-text">Barra</span>
          </div>
        </div>
      ) : (
        <div className="barra-chat-container">
          <div className="barra-header">
            Chat Barra
            <button className="close-btn" onClick={() => setIsMinimized(true)}>✕</button>
          </div>
          <div className="barra-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className="barra-msg">{msg}</div>
            ))}
          </div>
          <div className="barra-input">
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

export default ChatBarra;
