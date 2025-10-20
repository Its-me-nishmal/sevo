const mongoose = require('mongoose');
let io;
const userToCurrentChatPartnerId = new Map(); // userId -> currentChatPartnerId (null if not in a chat)
const socketIdToUserId = new Map(); // socket.id -> userId

const initSocket = (httpServer) => {
  io = require('socket.io')(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    socket.on('joinChat', (userId) => {
      socket.join(userId); // Join a room specific to the user
      socketIdToUserId.set(socket.id, userId);
      console.log(`User ${userId} joined chat room with socket ${socket.id}`);
    });

    socket.on('chatOpened', ({ userId, chatPartnerId }) => {
      userToCurrentChatPartnerId.set(userId, chatPartnerId);
      console.log(`Backend: User ${userId} opened chat with ${chatPartnerId}`);

      // 1. Notify chatPartnerId's friends list that userId has opened their chat
      io.to(chatPartnerId).emit('chatStatus', { friendId: userId, status: 'opened', context: 'friendsList' });
      console.log(`Backend: Emitting chatStatus to ${chatPartnerId} (friendsList): ${userId} opened chat`);
      // 2. Notify userId's friends list that chatPartnerId is now "opened" by userId
      io.to(userId).emit('chatStatus', { friendId: chatPartnerId, status: 'opened', context: 'friendsList' });
      console.log(`Backend: Emitting chatStatus to ${userId} (friendsList): ${chatPartnerId} opened by you`);

      // 3. Check for mutual chat (for chat window display)
      const chatPartnerCurrentChat = userToCurrentChatPartnerId.get(chatPartnerId);
      if (chatPartnerCurrentChat === userId) {
        // Both are in a mutual chat, so update both chat windows
        io.to(userId).emit('chatStatus', { friendId: chatPartnerId, status: 'opened', context: 'chatWindow' });
        console.log(`Backend: Emitting chatStatus to ${userId} (chatWindow): mutual chat with ${chatPartnerId}`);
        io.to(chatPartnerId).emit('chatStatus', { friendId: userId, status: 'opened', context: 'chatWindow' });
        console.log(`Backend: Emitting chatStatus to ${chatPartnerId} (chatWindow): mutual chat with ${userId}`);
      }
    });

    socket.on('chatClosed', ({ userId, chatPartnerId }) => {
      userToCurrentChatPartnerId.delete(userId); // User is no longer viewing this chat
      console.log(`Backend: User ${userId} closed chat with ${chatPartnerId}`);

      // 1. Notify chatPartnerId's friends list that userId has closed their chat
      io.to(chatPartnerId).emit('chatStatus', { friendId: userId, status: 'closed', context: 'friendsList' });
      console.log(`Backend: Emitting chatStatus to ${chatPartnerId} (friendsList): ${userId} closed chat`);
      // 2. Notify userId's friends list that chatPartnerId is now "closed" by userId
      io.to(userId).emit('chatStatus', { friendId: chatPartnerId, status: 'closed', context: 'friendsList' });
      console.log(`Backend: Emitting chatStatus to ${userId} (friendsList): ${chatPartnerId} closed by you`);

      // 3. Check if they were in a mutual chat (for chat window display)
      const chatPartnerCurrentChat = userToCurrentChatPartnerId.get(chatPartnerId);
      if (chatPartnerCurrentChat === userId) {
        // They were in a mutual chat, so now it's broken
        io.to(userId).emit('chatStatus', { friendId: chatPartnerId, status: 'closed', context: 'chatWindow' });
        console.log(`Backend: Emitting chatStatus to ${userId} (chatWindow): mutual chat with ${chatPartnerId} broken`);
        io.to(chatPartnerId).emit('chatStatus', { friendId: userId, status: 'closed', context: 'chatWindow' });
        console.log(`Backend: Emitting chatStatus to ${chatPartnerId} (chatWindow): mutual chat with ${userId} broken`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Backend: user disconnected', socket.id);
      const userId = socketIdToUserId.get(socket.id);
      if (userId) {
        const chatPartnerId = userToCurrentChatPartnerId.get(userId);
        if (chatPartnerId) {
          // If the disconnected user was in a chat, notify their partner's friends list
          io.to(chatPartnerId).emit('chatStatus', { friendId: userId, status: 'closed', context: 'friendsList' });
          console.log(`Backend: Emitting chatStatus to ${chatPartnerId} (friendsList): ${userId} disconnected`);
          // Also notify the disconnected user's friends list
          io.to(userId).emit('chatStatus', { friendId: chatPartnerId, status: 'closed', context: 'friendsList' });
          console.log(`Backend: Emitting chatStatus to ${userId} (friendsList): ${chatPartnerId} disconnected`);

          // Check if they were in a mutual chat
          const partnerCurrentChat = userToCurrentChatPartnerId.get(chatPartnerId);
          if (partnerCurrentChat === userId) {
            io.to(userId).emit('chatStatus', { friendId: chatPartnerId, status: 'closed', context: 'chatWindow' });
            console.log(`Backend: Emitting chatStatus to ${userId} (chatWindow): mutual chat with ${chatPartnerId} broken due to disconnect`);
            io.to(chatPartnerId).emit('chatStatus', { friendId: userId, status: 'closed', context: 'chatWindow' });
            console.log(`Backend: Emitting chatStatus to ${chatPartnerId} (chatWindow): mutual chat with ${userId} broken due to disconnect`);
          }
        }
        userToCurrentChatPartnerId.delete(userId);
        socketIdToUserId.delete(socket.id);
      }
    });

    socket.on('leaveChat', (userId) => {
      // This event is now less critical as chatClosed handles the state
      // But keep it for consistency if other parts rely on it
      socket.leave(userId);
      console.log(`Backend: User ${userId} left chat room`);
    });

  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIo };
