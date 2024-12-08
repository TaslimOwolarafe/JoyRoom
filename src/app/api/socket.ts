import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as IOServer } from "socket.io"
import { Server } from "socket.io"

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

const PORT = process.env.SOCKET_PORT || 3000;
const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket?.server?.io) {
    console.log('Socket.io already initialized');
    res.status(200).json({ success: true, message: "Socket is already running", socket: `:${PORT}` })
    return res.end();
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    cors: {
      origin: 'http://localhost/3000', // Adjust as needed for your CORS policy
      methods: ['GET', 'POST'],
    },
  });
  // const io = new Server({ path: "/api/socket", addTrailingSlash: false, cors: { origin: "*" } }).listen(PORT)
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('A user connected', socket.id);
    socket.on('disconnect', () => console.log('A user disconnected'));
  });

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId, username) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', username);
    });

    socket.on('send-message', (roomId, message, username) => {
      io.to(roomId).emit('receive-message', {
        message,
        username,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('user-typing', (roomId, username) => {
      socket.to(roomId).emit('typing', username);
    });

    socket.on('user-stopped-typing', (roomId, username) => {
      socket.to(roomId).emit('stopped-typing', username);
    });


    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });
  });


  res.end();
};

export default SocketHandler;
