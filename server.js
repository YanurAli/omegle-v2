// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const SimplePeer = require('simple-peer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const connectedUsers = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (roomId) => {
    // Check if the room exists
    if (!connectedUsers[roomId]) {
      connectedUsers[roomId] = {};
    }

    const initiator = new SimplePeer({ initiator: true, trickle: false });
    connectedUsers[roomId][socket.id] = initiator;

    initiator.on('signal', (data) => {
      socket.emit('offer', data);
    });

    initiator.on('connect', () => {
      console.log('Peer connected:', socket.id);
    });

    initiator.on('data', (data) => {
      io.to(roomId).emit('data', { id: socket.id, data });
    });

    initiator.on('stream', (stream) => {
      io.to(roomId).emit('stream', { id: socket.id, stream });
    });

    socket.on('answer', (answer) => {
      initiator.signal(answer);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      delete connectedUsers[roomId][socket.id];
    });

    socket.join(roomId);

    // Broadcast the user list to all users in the room
    io.to(roomId).emit('userList', Object.keys(connectedUsers[roomId]));

    socket.emit('join', initiator._signalData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find the room this user belongs to
    const roomId = Object.keys(connectedUsers).find(
      (key) => connectedUsers[key][socket.id]
    );
    if (roomId) {
      delete connectedUsers[roomId][socket.id];
      // Broadcast the updated user list to all users in the room
      io.to(roomId).emit('userList', Object.keys(connectedUsers[roomId]));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
