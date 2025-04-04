// File: src/components/RoomEntry.tsx
import { useState, FormEvent, ChangeEvent } from 'react';
import '../styles/RoomEntry.css';

interface RoomEntryProps {
  onJoinRoom: (roomId: string, username: string) => void;
}

const RoomEntry: React.FC<RoomEntryProps> = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      onJoinRoom(roomId, username);
    }
  };

  const handleCreateRoom = (): void => {
    // Generate random room ID (in a real app, this would come from the backend)
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setIsCreating(true);
  };

  const handleRoomIdChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setRoomId(e.target.value);
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setUsername(e.target.value);
  };

  return (
    <div className="room-entry-container">
      <div className="room-entry-content">
        <div className="logo-container">
          <h1>ChatWave</h1>
          <div className="wave-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12h4c4 0 2-8 6-8s2 8 6 8 2-8 6-8 2 8 6 8h2"></path>
            </svg>
          </div>
        </div>
        
        <div className="room-options">
          <button 
            className={`option-btn ${!isCreating ? 'active' : ''}`} 
            onClick={() => setIsCreating(false)}
            type="button"
          >
            Join Room
          </button>
          <button 
            className={`option-btn ${isCreating ? 'active' : ''}`} 
            onClick={() => setIsCreating(true)}
            type="button"
          >
            Create Room
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label htmlFor="username">Your Name</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={handleUsernameChange} 
              placeholder="Enter your name"
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="roomId">
              {isCreating ? 'New Room ID' : 'Room ID'}
            </label>
            <div className="room-id-input">
              <input 
                type="text" 
                id="roomId" 
                value={roomId} 
                onChange={handleRoomIdChange} 
                placeholder={isCreating ? 'Auto-generated room ID' : 'Enter room ID'}
                readOnly={isCreating}
                required 
              />
              {isCreating && (
                <button 
                  type="button" 
                  className="generate-btn"
                  onClick={handleCreateRoom}
                >
                  Generate
                </button>
              )}
            </div>
          </div>
          
          <button type="submit" className="submit-btn">
            {isCreating ? 'Create & Join' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RoomEntry;