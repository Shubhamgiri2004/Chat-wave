// File: src/App.tsx
import { useState } from 'react';
import RoomEntry from './components/RoomEntry';
import ChatRoom from "./components/ChatRoom";
import './App.css';

const App: React.FC = () => {
  const [room, setRoom] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  const handleJoinRoom = (roomId: string, user: string): void => {
    setRoom(roomId);
    setUsername(user);
  };

  const handleLeaveRoom = (): void => {
    setRoom(null);
  };

  return (
    <div className="app-container">
      {!room ? (
        <RoomEntry onJoinRoom={handleJoinRoom} />
      ) : (
        <ChatRoom roomId={room} username={username} onLeaveRoom={handleLeaveRoom} />
      )}
    </div>
  );
}

export default App;