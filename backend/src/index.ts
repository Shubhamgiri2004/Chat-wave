import * as http from 'http';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import * as path from 'path';

// Define interface for client connection tracking
interface ClientConnection {
  id: string;
  socket: WebSocket;
  lastActivity: Date;
}

// Define interface for message structure
interface Message {
  type: string;
  content: any;
  sender: string;
  timestamp: number;
}

class WebSocketServer {
  private server: http.Server;
  private wss: WebSocket.Server;
  private clients: Map<string, ClientConnection> = new Map();
  private PORT: number = 8080;

  constructor() {
    // Create HTTP server
    this.server = http.createServer((req, res) => {
      // Serve static files for client-side application
      if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, '../public/index.html');
        this.serveFile(res, filePath, 'text/html');
      } else {
        const filePath = path.join(__dirname, '../public', req.url || '');
        this.serveFile(res, filePath);
      }
    });

    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.setupWebSocketEvents();
  }

  private serveFile(res: http.ServerResponse, filePath: string, contentType?: string): void {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }

      if (!contentType) {
        const ext = path.extname(filePath);
        // Set content type based on file extension
        switch (ext) {
          case '.js':
            contentType = 'text/javascript';
            break;
          case '.css':
            contentType = 'text/css';
            break;
          case '.json':
            contentType = 'application/json';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          default:
            contentType = 'text/plain';
        }
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  }

  private setupWebSocketEvents(): void {
    this.wss.on('connection', (socket: WebSocket) => {
      // Create unique ID for this client
      const clientId = this.generateUniqueId();
      
      // Store client connection
      this.clients.set(clientId, {
        id: clientId,
        socket,
        lastActivity: new Date()
      });

      console.log(`Client connected: ${clientId}`);
      
      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        content: { id: clientId, message: 'Connected to server' },
        sender: 'server',
        timestamp: Date.now()
      });

      // Broadcast new user connection
      this.broadcast({
        type: 'user_joined',
        content: { id: clientId },
        sender: 'server',
        timestamp: Date.now()
      }, clientId);
      
      // Handle incoming messages
      socket.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Update last activity time
          const client = this.clients.get(clientId);
          if (client) {
            client.lastActivity = new Date();
          }
          
          // Add sender and timestamp if not present
          if (!message.sender) message.sender = clientId;
          if (!message.timestamp) message.timestamp = Date.now();
          
          console.log(`Received message from ${clientId}:`, message);
          
          // Process message based on type
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Error processing message:', error);
          this.sendToClient(clientId, {
            type: 'error',
            content: 'Invalid message format',
            sender: 'server',
            timestamp: Date.now()
          });
        }
      });
      
      // Handle client disconnection
      socket.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        
        // Notify other clients about disconnection
        this.broadcast({
          type: 'user_left',
          content: { id: clientId },
          sender: 'server',
          timestamp: Date.now()
        });
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error(`Error with client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: Message): void {
    switch (message.type) {
      case 'chat':
        // Broadcast chat messages to all clients
        this.broadcast(message);
        break;
        
      case 'ping':
        // Respond to ping with pong
        this.sendToClient(clientId, {
          type: 'pong',
          content: { timestamp: Date.now() },
          sender: 'server',
          timestamp: Date.now()
        });
        break;
        
      case 'private_message':
        // Handle private message to specific client
        if (message.content && message.content.recipient) {
          const recipientId = message.content.recipient;
          this.sendToClient(recipientId, message);
          // Also confirm to sender
          this.sendToClient(clientId, {
            type: 'message_delivered',
            content: { original: message },
            sender: 'server',
            timestamp: Date.now()
          });
        }
        break;
        
      default:
        console.log(`Unhandled message type: ${message.type}`);
    }
  }

  private sendToClient(clientId: string, message: Message): boolean {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  private broadcast(message: Message, excludeClientId?: string): void {
    this.clients.forEach((client) => {
      if (!excludeClientId || client.id !== excludeClientId) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(JSON.stringify(message));
        }
      }
    });
  }

  private generateUniqueId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public start(): void {
    this.server.listen(this.PORT, () => {
      console.log(`WebSocket Server is running on port ${this.PORT}`);
    });
    
    // Set up interval for checking inactive connections
    setInterval(() => this.checkInactiveConnections(), 30000);
  }

  private checkInactiveConnections(): void {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes timeout
    
    this.clients.forEach((client, clientId) => {
      const timeDiff = now.getTime() - client.lastActivity.getTime();
      if (timeDiff > timeout) {
        console.log(`Client ${clientId} timed out due to inactivity`);
        client.socket.terminate();
        this.clients.delete(clientId);
      }
    });
  }
}

// Create and start the server
const wsServer = new WebSocketServer();
wsServer.start();

export default WebSocketServer;