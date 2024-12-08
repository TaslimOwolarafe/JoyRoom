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
}

export const useChatStore = create<ChatStore>((set) => ({
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
}));
