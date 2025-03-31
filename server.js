const { PeerServer } = require('peer');
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Create PeerJS server with enhanced debugging
const peerServer = PeerServer({
  port: 9000,
  path: '/peerjs',
  allow_discovery: true,
  proxied: true,
  corsOptions: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  },
  debug: true,
  key: 'peerjs'
});

// Track connected clients
const connectedClients = new Map();

peerServer.on('connection', (client) => {
  const clientId = client.getId();
  connectedClients.set(clientId, {
    connectedAt: new Date(),
    lastPing: new Date()
  });
  
  console.log('New client connected:', {
    id: clientId,
    totalClients: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

peerServer.on('disconnect', (client) => {
  const clientId = client.getId();
  const clientInfo = connectedClients.get(clientId);
  connectedClients.delete(clientId);
  
  console.log('Client disconnected:', {
    id: clientId,
    connectionDuration: clientInfo ? (new Date() - clientInfo.connectedAt) / 1000 : 'unknown',
    remainingClients: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

// Handle errors
peerServer.on('error', (error) => {
  console.error('PeerServer error:', {
    message: error.message,
    type: error.type,
    timestamp: new Date().toISOString()
  });
});

// Add a heartbeat endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    connectedClients: Array.from(connectedClients.keys()),
    totalConnections: connectedClients.size,
    uptime: process.uptime()
  });
});

// Start the express server
const expressServer = app.listen(9001, () => {
  console.log('Status server running on port 9001');
});

console.log('PeerJS server initialized:', {
  port: 9000,
  path: '/peerjs',
  timestamp: new Date().toISOString()
}); 