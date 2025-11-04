import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import type { Message } from './types';

function App() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    // Socket event listeners
    useEffect(() => {
      // Connection events
      socket.on('connect', () => {
        console.log('✅ Connected to server');
        setIsConnected(true);
      });
  
      socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        setIsConnected(false);
      });
  
      // Chat events
      socket.on('chat_history', (history: Message[]) => {
        console.log('📜 Received chat history:', history);
        setMessages(history);
      });
  
      socket.on('new_message', (msg: Message) => {
        console.log('💬 New message:', msg);
        setMessages(prev => [...prev, msg]);
      });
  
      socket.on('user_joined', (data) => {
        console.log('👋 User joined:', data);
        setOnlineUsers(data.onlineUsers);
      });
  
      socket.on('user_left', (data) => {
        console.log('👋 User left:', data);
        setOnlineUsers(data.onlineUsers);
      });
  
      // Cleanup on unmount
      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('chat_history');
        socket.off('new_message');
        socket.off('user_joined');
        socket.off('user_left');
      };
    }, []);

    const handleJoin = (e: React.FormEvent) => {
      e.preventDefault();
      if (username.trim()) {
        socket.connect();
        socket.emit('join', username.trim());
        setIsJoined(true);
      }
    };
  
    const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim()) {
        socket.emit('send_message', { username, message: message.trim() });
        setMessage('');
      }
    };

      // Login Screen
  if (!isJoined) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h1 style={styles.title}>💬 Chat App</h1>
          <form onSubmit={handleJoin} style={styles.form}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <button type="submit" style={styles.button}>
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Chat Screen
  return (
    <div style={styles.container}>
      <div style={styles.chatContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>💬 Chat Room</h2>
          <div style={styles.headerInfo}>
            <span style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            <span style={{ marginLeft: '20px' }}>
              👤 {username}
            </span>
            <span style={{ marginLeft: '20px' }}>
              👥 {onlineUsers.length} online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.noMessages}>No messages yet. Start chatting!</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.message,
                  backgroundColor: msg.username === username ? '#dbeafe' : '#f3f4f6'
                }}
              >
                <div style={styles.messageHeader}>
                  <strong>{msg.username}</strong>
                  <span style={styles.messageTime}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div style={styles.messageText}>{msg.message}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.messageInput}
            disabled={!isConnected}
          />
          <button
            type="submit"
            style={styles.sendButton}
            disabled={!isConnected || !message.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// Simple inline styles
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '30px',
    color: '#1f2937',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  chatContainer: {
    width: '100%',
    maxWidth: '800px',
    height: '600px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '20px',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: '12px 12px 0 0',
  },
  headerTitle: {
    margin: '0 0 10px 0',
    color: '#1f2937',
  },
  headerInfo: {
    fontSize: '14px',
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  noMessages: {
    textAlign: 'center' as const,
    color: '#9ca3af',
    padding: '40px',
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    maxWidth: '70%',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '14px',
  },
  messageTime: {
    color: '#6b7280',
    fontSize: '12px',
  },
  messageText: {
    color: '#1f2937',
  },
  inputContainer: {
    display: 'flex',
    padding: '20px',
    borderTop: '2px solid #e5e7eb',
    gap: '10px',
  },
  messageInput: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  sendButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default App;