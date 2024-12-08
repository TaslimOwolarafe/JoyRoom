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
import { LogOut, Send, Copy, Plus, MessageSquare } from 'lucide-react';

const TYPING_STOP_DELAY = 7000;

export default function ChatClient() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const roomId = params.roomId as string;

  const { username, messages, addMessage, clearMessages } = useChatStore();
  const [message, setMessage] = useState('');

  const [typingUsers, setTypingUsers] = useState(new Set<string>());
  let typingTimeout: NodeJS.Timeout | null = null; // For debounce

  // Dummy data for rooms - you'll replace this with real data
  const rooms = [
    { id: roomId, name: 'Current Room', unread: 0, active: true },
    { id: 'room-2', name: 'Room 2', unread: 3, active: false },
    { id: 'room-3', name: 'Room 3', unread: 0, active: false },
  ];

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
      addMessage({
        message: `${username} has joined the room.`,
        username: username,
        timestamp: new Date(),
        type: 'notification',
      });
    });

    socket.on('user-left', (username) => {
      addMessage({
        message: `${username} has left the room.`,
        username: username,
        timestamp: new Date(),
        type: 'notification',
      });
    });

    

    socket.on('receive-message', (msg) => {
      addMessage(msg);
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

    return () => {
      socket.disconnect();
      clearMessages();
      socket.off('connect');
      socket.off('connect_error');
      socket.off('receive-message');
      socket.off('typing');
      socket.off('stopped-typing');
    };
  }, [roomId, username, addMessage, clearMessages, router]);

  const sendMessage = () => {
    if (!message.trim()) return;
    // addMessage({ message, username, timestamp: new Date() });
    socket.emit('send-message', roomId, message, username);
    setMessage('');
    socket.emit('user-stopped-typing', roomId, username);
  };

  const leaveRoom = () => {
    // if (socket.connected) {
    socket.emit('leave-room', roomId, username)
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

    // Emit 'user-typing' when the user types
    socket.emit('user-typing', roomId, username);

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Set a new timeout to emit 'user-stopped-typing'
    typingTimeout = setTimeout(() => {
      socket.emit('user-stopped-typing', roomId, username);
    }, TYPING_STOP_DELAY);
  };


  return (
    <div className="h-[calc(100vh)]">
      <div className="grid grid-cols-12 h-full">
        {/* Sidebar */}
        <Card className="col-span-3 flex flex-col h-full rounded-none">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg mb-4">Your Chats</h2>
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Join New Room
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {rooms.map((room) => (
                <div key={room.id}>
                  <Button
                    variant={room.active ? 'secondary' : 'ghost'}
                    className="w-full justify-start mb-1"
                    onClick={() => router.push(`/chat/${room.id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{room.name}</span>
                    {room.unread > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {room.unread}
                      </span>
                    )}
                  </Button>
                </div>
              ))}
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
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'
                    }`}
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
