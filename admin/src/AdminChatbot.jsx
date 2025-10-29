// admin/src/AdminChatbot.jsx
import React, { createContext, useContext } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import './chatbot.css';

// Crear contexto para compartir el actionProvider
const ActionContext = createContext(null);

// --- Componente para los Botones de Sugerencia ---
const OptionsWidget = () => {
  const actionProvider = useContext(ActionContext);

  const handleClick = (message) => {
    console.log('[OptionsWidget] Enviando mensaje:', message);
    if (actionProvider && actionProvider.handleUserMessage) {
      actionProvider.handleUserMessage(message);
    } else {
      console.error('[OptionsWidget] actionProvider no disponible');
    }
  };

  const options = [
    { text: "Ventas de hoy", message: "Ventas de hoy", id: 1 },
    { text: "Reservaciones pendientes", message: "Reservaciones pendientes", id: 2 },
    { text: "Insumos con stock bajo", message: "Stock bajo", id: 3 },
    { text: "Producto más vendido", message: "Producto más vendido", id: 4 },
  ];

  return (
    <div className="options-container">
      {options.map((option) => (
        <button 
          key={option.id} 
          onClick={() => handleClick(option.message)} 
          className="option-button"
        >
          {option.text}
        </button>
      ))}
    </div>
  );
};

const createChatBotMessage = (message, options) => ({ 
  message, 
  type: 'bot', 
  ...options 
});

// --- Configuración del Chatbot ---
const config = {
  initialMessages: [
    createChatBotMessage(
      "¡Hola! 👋 Soy tu asistente administrativo de Doppler Bar.\n\n¿Qué necesitas consultar?",
      { widget: 'optionsWidget' }
    )
  ],
  botName: "Asistente Doppler",
  customStyles: {
    botMessageBox: {
      backgroundColor: '#6366f1',
    },
    chatButton: {
      backgroundColor: '#6366f1',
    },
  },
  widgets: [
    {
      widgetName: 'optionsWidget',
      widgetFunc: () => <OptionsWidget />,
    },
  ],
};

// --- Message Parser ---
const MessageParser = ({ children, actions }) => {
  const parse = (message) => {
    if (actions && actions.handleUserMessage) {
      actions.handleUserMessage(message);
    }
  };

  return (
    <div>
      {React.Children.map(children, (child, index) => 
        React.cloneElement(child, { parse, key: `parser-${index}` })
      )}
    </div>
  );
};

// --- Action Provider ---
const ActionProvider = ({ createChatBotMessage, setState, children }) => {
  const handleUserMessage = async (userMessage) => {
    try {
      console.log('[AdminChatbot] Enviando mensaje:', userMessage);
      
      const response = await fetch('http://127.0.0.1:8000/api/chatbot/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[AdminChatbot] Respuesta recibida:', data);

      const botMessage = createChatBotMessage(
        data.response || 'No recibí respuesta del servidor.',
        { widget: 'optionsWidget' }
      );
      
      setState((prev) => ({ 
        ...prev, 
        messages: [...prev.messages, botMessage] 
      }));
    } catch (error) {
      console.error('[AdminChatbot] Error:', error);
      
      let errorMessage = '❌ Lo siento, ocurrió un error al procesar tu consulta.';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '🔌 No puedo conectarme al servidor. Verifica que esté corriendo en http://127.0.0.1:8000';
      } else if (error.message.includes('404')) {
        errorMessage = '🔍 El endpoint del chatbot no está disponible. Contacta al administrador.';
      } else if (error.message.includes('500')) {
        errorMessage = '⚠️ Error en el servidor. Por favor intenta nuevamente.';
      }

      const errorBotMessage = createChatBotMessage(errorMessage, {
        widget: 'optionsWidget',
      });
      
      setState((prev) => ({ 
        ...prev, 
        messages: [...prev.messages, errorBotMessage] 
      }));
    }
  };

  const actionProviderValue = { handleUserMessage };

  return (
    <ActionContext.Provider value={actionProviderValue}>
      <div>
        {React.Children.map(children, (child, index) => {
          return React.cloneElement(child, {
            actions: { handleUserMessage },
            key: `action-${index}`,
          });
        })}
      </div>
    </ActionContext.Provider>
  );
};

// --- Componente Principal ---
function AdminChatbot() {
  const [isMinimized, setIsMinimized] = React.useState(true);

  if (isMinimized) {
    return (
      <div className="chatbot-minimized" onClick={() => setIsMinimized(false)}>
        <div className="chatbot-minimized-content">
          <span className="chatbot-icon">💬</span>
          <span className="chatbot-text">Asistente</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container chatbot-expanded">
      <div className="chatbot-header-controls">
        <button 
          className="chatbot-control-btn close-btn" 
          onClick={() => setIsMinimized(true)}
          title="Minimizar"
        >
          ✕
        </button>
      </div>
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProvider}
        placeholderText="Escribe tu consulta aquí..."
        headerText="Asistente Doppler Bar 🍺"
      />
    </div>
  );
}

export default AdminChatbot;
