const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});
app.use(cors({
    origin: process.env.CLIENT_URL,
    optionsSuccessStatus: 200, // For legacy browser support
}));

// import routes -----------------------------------
const authRoutes = require('./routes/auth.route.js');
const userRoutes = require('./routes/user.route.js');
const roomRoutes = require('./routes/room.route.js');

// socket.io listener ------------------------------
const socketListen = require('./socketComm.js')
socketListen(io);
// const socketCommunication1 = require('./socketConn-test/socket.communication1.js');
// socketCommunication1(io);

// Import global middlewares -----------------------
const { setClientHeader } = require('./validators/index.validator.js');
const connectToMongoDB = require('./db/dbConnect.js');

// app middlewares ---------------------------------
app.use(morgan('dev'));
app.use(bodyParser.json());
if (process.env.NODE_ENV === 'development') {
    app.use(cors({ origin: `http://localhost:4500` }));
}

// middlewares -------------------------------------
app.use('/api', setClientHeader, authRoutes);
app.use('/api', setClientHeader, userRoutes);
app.use('/api/rooms', setClientHeader, roomRoutes);

const PORT = process.env.PORT || 4500;
// app.listen(PORT, () => {
//     console.log(`Server running: http://localhost:${PORT}`)
// })
server.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server running: http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});