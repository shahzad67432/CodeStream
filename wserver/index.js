const WebSocket = require('ws');
const { createClient } = require('redis');

const wss = new WebSocket.Server({ port: 3003 });
const redisClient = createClient();
const redisPublisher = createClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisPublisher.on('error', (err) => console.log('Redis Publisher Error', err));

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
    });
});

redisClient.connect();
redisPublisher.connect();

// Listen for messages on the "results" channel
redisClient.subscribe('results', (message) => {
    console.log(`Broadcasting message: ${message}`);
    // Broadcast the message to all connected WebSocket clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
});
