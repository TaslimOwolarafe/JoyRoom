'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { socket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatStore } from '@/store/chatStore';
import { useToast } from '@/hooks/use-toast';

import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Send, Copy, Plus, MessageSquare } from 'lucide-react';

const TYPING_STOP_DELAY = 7000;

interface Participant {
  id: string;
  username: string;
}

interface ApiMessage {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
  messageType?: 'chat' | 'notification';
}
export default function ChatClient() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const roomId = params?.roomId as string;

  const { username, rooms, addMessage, clearMessages, markRoomAsRead, setActiveRoom, activeRoomId, removeParticipant, addParticipant, fetchRooms } = useChatStore();
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set<string>());
  let typingTimeout: NodeJS.Timeout | null = null;

  // const { rooms, username, removeParticipant } = useChatStore((state) => ({
  //   rooms: state.rooms,
  //   username: state.username,
  //   removeParticipant: state.removeParticipant,
  // }));

  const fetchParticipants = async () => {
    setIsFetching(true);
    setFetchError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}/participants`);
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      const data = await response.json();
      setParticipants(data);
      console.log(participants)
    } catch (error) {
      setFetchError('An error occurred');
    } finally {
      setIsFetching(false);
    }
  };

  const room = rooms[roomId];
  const isOwner = room?.owner === username;

  useEffect(() => {
    if (!roomId || !username) {
      router.push('/');
      return;
    }

    socket.connect();
    socket.on('connect', () => {
      console.log('Socket connected', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message, error);
    });

    socket.emit('join-room', roomId, username);

    socket.on('user-joined', (username) => {
      addMessage(roomId, {
        message: `${username} has joined the room.`,
        username: username,
        timestamp: new Date(),
        type: 'notification',
      });
      addParticipant(roomId, username);
    });

    socket.on('user-left', (username) => {
      addMessage(roomId, {
        message: `${username} has left the room.`,
        username: username,
        timestamp: new Date(),
        type: 'notification',
      });
      removeParticipant(roomId, username)
    });

    socket.on('remove-participant', (participant) => {
      addMessage(roomId, {
        message: `${participant} was removed by the room owner.`,
        username: participant,
        timestamp: new Date(),
        type: 'notification',
      });
      useChatStore.getState().removeParticipant(roomId, participant); // Direct update
    });

    socket.on('receive-message', (msg) => {
      addMessage(roomId, msg);
      markRoomAsRead(roomId);
    });

    socket.on('typing', (typingUsername) => {
      setTypingUsers((prev) => new Set([...prev, typingUsername]));
    });

    socket.on('stopped-typing', (stoppedUsername) => {
      setTypingUsers((prev) => {
        const updatedSet = new Set(prev);
        updatedSet.delete(stoppedUsername);
        return updatedSet;
      });
    });

    fetchRooms();
    return () => {
      socket.disconnect();
      clearMessages(roomId);
      socket.off('connect');
      socket.off('connect_error');
      socket.off('receive-message');
      socket.off('typing');
      socket.off('stopped-typing');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('remove-participant');
    };
  }, [roomId, username, addMessage, clearMessages, markRoomAsRead, router, fetchRooms]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    socket.emit('send-message', roomId, message, username);
    setMessage('');
    socket.emit('user-stopped-typing', roomId, username);

    try {
      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, sender: username, messageType: 'chat' }),
      });

      if (!response.ok) {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const leaveRoom = () => {
    useChatStore.getState().leaveRoom(roomId);
    socket.emit('leave-room', roomId, username);
    router.push('/');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: 'Room ID copied!',
      description: 'Share this with others to join the chat.',
    });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    socket.emit('user-typing', roomId, username);

    if (typingTimeout) clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      socket.emit('user-stopped-typing', roomId, username);
    }, TYPING_STOP_DELAY);
  };

  const handleJoinRoom = async () => {
  const trimmedRoomName = roomName.trim();

  if (!trimmedRoomName) {
    alert('Please enter a room name or ID.');
    return;
  }

  try {
    const response = await fetch(`/api/rooms/${trimmedRoomName}/messages`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.log('Room does not exist:', await response.json());
      return;
    }

    const messages = await response.json();

    console.log(messages)

    useChatStore.setState((state) => {
      const newMessages = messages.map((msg: ApiMessage) => ({
        message: msg.content,
        username: msg.sender,
        timestamp: new Date(msg.createdAt),
        type: msg.messageType || 'chat',
      }));
    
      return {
        rooms: {
          ...state.rooms,
          [trimmedRoomName]: {
            ...(state.rooms[trimmedRoomName] || {
              name: trimmedRoomName,
              messages: [],
              unreadCount: 0,
              unread: 0,
              active: false,
            }),
            messages: newMessages,
          },
        },
      };
    });

    joinRoom();
    setIsDialogOpen(false);
    setRoomName('');
  } catch (error) {
    console.error('Error fetching room messages:', error);
  }
};

const joinRoom = async () => {
  if (!username.trim() || !roomName.trim()) return;

  try {
    const response = await fetch(`/api/rooms/${roomName}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      console.log('Failed to join room:', await response.json());
      return;
    }

    const data = await response.json();

    useChatStore.setState((state) => {
      const room = state.rooms[roomName];
      if (!room) {
        return {
          rooms: {
            ...state.rooms,
            [roomName]: {
              name: roomName,
              owner: data.owner || username,
              participants: data.participants || [username],
              messages: [],
              unreadCount: 0,
              unread: 0,
              active: false,
            },
          },
        };
      } else {
        if (!room.participants.includes(username)) {
          room.participants.push(username);
        }
        return {
          rooms: { ...state.rooms },
        };
      }
    });

    router.push(`/chat/${roomName}`);
  } catch (error) {
    console.log('Error joining room:', error);
  }
};

const handleRoomClick = async (roomKey: string) => {
  try {
    const response = await fetch(`/api/rooms/${roomKey}/messages`);
    if (!response.ok) {
      console.error(`Failed to fetch messages for room ${roomKey}:`, response.statusText);
      return;
    }

    const apiMessages = await response.json();
    console.log(apiMessages)

    const newMessages = apiMessages.map((msg: ApiMessage) => ({
      message: msg.content,
      username: msg.sender,
      timestamp: new Date(msg.createdAt),
      type: msg.messageType || 'chat',
    }));

    useChatStore.setState((state) => {
      const updatedRooms = Object.fromEntries(
        Object.entries(state.rooms).map(([key, room]) => [
          key,
          {
            ...room,
            active: key === roomKey,
            messages: key === roomKey ? newMessages : room.messages,
          },
        ])
      );

      setActiveRoom(roomKey)
      return { rooms: updatedRooms };
    });

    // Navigate to the selected room
    router.push(`/chat/${roomKey}`);
  } catch (error) {
    console.error(`Error fetching messages for room ${roomKey}:`, error);
  }
};


  return (
    <div className="h-[calc(100vh)]">
      <div className="grid grid-cols-12 h-full">
        {/* Sidebar */}
        <Card className="col-span-3 flex flex-col h-full rounded-none">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg mb-4">Your Chats</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Join New Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Room</DialogTitle>
                  <DialogDescription>Enter the room name or ID below to join.</DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="Room Name or ID"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="mt-4"
                />
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoinRoom}>Join Room</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {Object.keys(rooms).map((roomKey) => {
                const room = rooms[roomKey];
                // console.log(rooms)
                return (
                  <div key={roomKey}>
                    <Button
                      variant={room.active ? 'secondary' : 'ghost'}
                      className="w-full justify-start mb-1"
                      onClick={() => handleRoomClick(roomKey)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left">{room.name}</span>
                      {room.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                          {room.unreadCount}
                        </span>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <p className="text-sm font-medium">Logged in as:</p>
                <p className="text-sm text-muted-foreground">{username}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={leaveRoom}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Chat Area */}
        <Card className="col-span-9 flex flex-col h-full rounded-none">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold">Chat Room</h2>
                <div className="flex items-center space-x-2">
                  <code className="text-sm text-muted-foreground">
                    {roomId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyRoomId}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={fetchParticipants} // Fetch participants on button click
                      disabled={isFetching} // Disable while fetching
                    >
                      {isFetching ? 'Loading...' : 'View Participants'}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Participants</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                      {fetchError && (
                        <div className="text-red-500 text-sm">
                          Error: {fetchError}
                        </div>
                      )}
                      {!isFetching && participants.length === 0 && !fetchError && (
                        <div className="text-muted-foreground">
                          No participants found.
                        </div>
                      )}
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between">
                          <span>{participant.username}</span>
                          {isOwner && participant.username !== username && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeParticipant(roomId, participant.username)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {rooms[roomId]?.messages?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}
                >
                  {msg.type === 'notification' ? (
                    <div className="max-w-[80%] p-3 bg-muted text-muted-foreground text-center italic">
                      {msg.message}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${msg.username === username
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-sm">
                          {msg.username === username ? 'You' : msg.username}
                        </p>
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1">{msg.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {typingUsers.size > 0 && (
              <div className="p-2 text-sm italic text-muted-foreground">
                {Array.from(typingUsers).join(', ')} {typingUsers.size > 1 ? 'are' : 'is'} typing...
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={handleTyping}
                placeholder="Type your message..."
                className="flex-1 h-14"
              />
              <Button onClick={sendMessage} className="h-14">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
