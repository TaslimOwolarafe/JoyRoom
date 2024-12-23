import { create } from 'zustand';

interface Message {
  message: string;
  username: string;
  timestamp: Date;
  type?: 'chat' | 'notification';
}

interface Room {
  name: string;
  messages: Message[];
  unreadCount: number;
  unread: number;
  active: boolean;
  owner: string;
  participants: string[];
}

interface ChatStore {
  activeRoomId: string | null;
  username: string;
  rooms: Record<string, Room>;
  setUsername: (username: string) => void;
  addMessage: (roomId: string, message: Message) => void;
  clearMessages: (roomId: string) => void;
  markRoomAsRead: (roomId: string) => void;
  setActiveRoom: (roomId: string) => void;
  addParticipant: (roomId: string, participant: string) => void;
  removeParticipant: (roomId: string, username: string) => void;
  leaveRoom: (roomId: string) => void;
  fetchMessages: (roomId: string) => void;
  sendMessage: (roomId: string, content: string) => void;
  fetchRooms: () => void;
}



export const useChatStore = create<ChatStore>((set, get) => ({
  activeRoomId: null,
  username: '',
  rooms: {},
  setUsername: (username) => set({ username }),
  addMessage: (roomId, message) =>
    set((state) => {
      const room = state.rooms[roomId] || { messages: [], unreadCount: 0 };
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: [...room.messages, message],
            unreadCount: room.unreadCount + 1,
          },
        },
      };
    }),


  fetchMessages: async (roomId: string) => {
    const response = await fetch(`/api/rooms/${roomId}/messages`);
    const messages: Message[] = await response.json();
    set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: {
          ...state.rooms[roomId],
          messages,
        },
      },
    }));
  },

  sendMessage: async (roomId: string, content: string) => {
    const username = get().username;
    const response = await fetch(`/api/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, username, messageType: 'chat' }),
    });

    if (!response.ok) {
      console.error('Failed to send message');
      return;
    }

    const message = await response.json();
    get().addMessage(roomId, message);
  },

  addParticipant: (roomId, participant) =>
    set((state) => {
      const room = state.rooms[roomId];
      console.log(room)
      if (room && !room.participants?.includes(participant)) {
        return {
          rooms: {
            ...state.rooms,
            [roomId]: {
              ...room,
              participants: [...room.participants, participant],
            },
          },
        };
      }
      return state;
    }),

  clearMessages: (roomId) =>
    set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: { ...state.rooms[roomId], messages: [], unreadCount: 0 },
      },
    })),
  markRoomAsRead: (roomId) =>
    set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: { ...state.rooms[roomId], unreadCount: 0 },
      },
    })),

  setActiveRoom: (roomId) =>
    set((state) => ({
      activeRoomId: roomId,
      rooms: {
        ...state.rooms,
        [roomId]: { ...state.rooms[roomId], active: true },
      },
    })),

  fetchRooms: async () => {
    const username = get().username;
    if (!username) {
      console.error('Username is required to fetch rooms.');
      return;
    }
    try {
      const response = await fetch(`/api/rooms?username=${username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
  
      const rooms: Room[] = await response.json();
  
      const roomsState = rooms.reduce((acc, room) => {
        acc[room.name] = room;
        return acc;
      }, {} as Record<string, Room>);
  
      set({ rooms: roomsState });
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  },

  removeParticipant: (roomId: string, username: string) =>
    set((state) => {
      const room = state.rooms[roomId];
      if (room && room.owner === state.username) {
        return {
          rooms: {
            ...state.rooms,
            [roomId]: {
              ...room,
              participants: room.participants.filter((user) => user !== username),
            },
          },
        };
      }
      return state;
    }),

  leaveRoom: (roomId: string) =>
    set((state) => {
      const room = state.rooms[roomId];
      if (room) {
        const newParticipants = room.participants.filter(
          (user) => user !== state.username
        );

        let newOwner = room.owner;
        if (room.owner === state.username && newParticipants.length > 0) {
          newOwner = newParticipants[0];
        }

        return {
          rooms: {
            ...state.rooms,
            [roomId]: {
              ...room,
              participants: newParticipants,
              owner: newOwner,
            },
          },
        };
      }
      return state;
    }),
}));


console.log(useChatStore)