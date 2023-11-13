io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (offer) => {
        const receiver = new SimplePeer({ trickle: false });
        connectedPeers[socket.id] = receiver;

        receiver.on('signal', (data) => {
            socket.emit('offer', data);
        });

        receiver.on('connect', () => {
            console.log('Connected to remote user:', socket.id);
        });

        receiver.on('data', (data) => {
            io.emit('data', data);
        });

        socket.on('answer', (answer) => {
            receiver.signal(answer);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            delete connectedPeers[socket.id];
        });

        socket.emit('join', receiver._signalData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete connectedPeers[socket.id];
    });
});
