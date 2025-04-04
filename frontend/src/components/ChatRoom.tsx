// File: src/components/ChatRoom.tsx
import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Message } from '../types';
import '../styles/ChatRoom.css';

interface ChatRoomProps {
  roomId: string;
  username: string;
  onLeaveRoom: () => void;
}


// Chat Room
const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, username, onLeaveRoom }) => {
  const [messages, setMessages] = useState<Message[]>([
    // Sample messages for demonstration
    { id: 1, sender: 'System', text: 'Welcome to the chat room!', timestamp: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  //Websocket connection
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    //socket connection 
    socketRef.current = new WebSocket("https://chat-wave-myac.onrender.com");

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        const newMsg: Message = {
          id: Date.now(),
          sender: data.sender,
          text: data.content,
          timestamp: new Date(data.timestamp),
        };
        setMessages(prev => [...prev, newMsg]); // ✅ This will now work
      }
    };
    return () => {
      socketRef.current?.close();
    };

  }, []);

  // Handling sent message

  const handleSendMessage = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
      const msgToSend = {
        type: 'chat',
        content: newMessage,
        sender: username,
        timestamp: Date.now(),
      };
      socketRef.current.send(JSON.stringify(msgToSend));
      setNewMessage('');
    }
  };
  
  
  const handleMessageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNewMessage(e.target.value);
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-room-container">
      <div className="chat-header">
        <div className="room-info">
          <h2>Room: {roomId}</h2>
          <span className="user-count">3 users online</span>
        </div>
        <button className="leave-btn" onClick={onLeaveRoom}>Leave Room</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === username ? 'own-message' : ''} ${message.sender === 'System' ? 'system-message' : ''}`}
          >
            {message.sender !== username && message.sender !== 'System' && (
              <div className="message-sender">{message.sender}</div>
            )}
            <div className="message-bubble">
              <div className="message-text">{message.text}</div>
              <div className="message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-form" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          value={newMessage} 
          onChange={handleMessageChange} 
          placeholder="Type your message..." 
        />
        <button type="submit">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13"></path>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
          </svg>
        </button>
      </form>
    </div>
  );
}



export default ChatRoom;