'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus, LogIn } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

export default function HomeClient() {
  const router = useRouter();

  const { setUsername, rooms, addMessage, setActiveRoom } = useMemo(
    () => useChatStore.getState(),
    []
  );

  const [username, setUsernameLocal] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');

  const createRoom = async () => {
    if (!username.trim()) return;
    const newRoomId = Math.random().toString(36).substring(7);

    try {
      const response = await fetch('/api/rooms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, roomName: newRoomId }),
      });

      if (!response.ok) {
        console.error('Failed to create room:', await response.json());
        return;
      }

      const { roomId, roomName } = await response.json();
      setRoomName(roomName)

      setUsername(username);

      useChatStore.setState((state) => ({
        rooms: {
          ...state.rooms,
          [newRoomId]: {
            name: newRoomId,
            messages: [],
            unreadCount: 0,
            unread: 0,
            active: false,
            owner: username,
            participants: [username],
          },
        },
      }));

      setActiveRoom(newRoomId);
      router.push(`/chat/${newRoomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = async () => {
    if (!username.trim() || !roomId.trim()) return;
    console.log(username, roomId)
    try {
      const response = await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
  
      if (!response.ok) {
        console.log('Failed to join room:', await response.json());
        return;
      }

      const data = await response.json();

      setUsername(username);

      useChatStore.setState((state) => {
        const room = state.rooms[roomId];
        if (!room) {
          return {
            rooms: {
              ...state.rooms,
              [roomId]: {
                name: roomId,
                owner: username,
                participants: [username],
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
    
      setActiveRoom(roomId);
      router.push(`/chat/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            Welcome to JoyRoom
          </CardTitle>
          <CardDescription>
            Create a new room or join an existing one to start chatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsernameLocal(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              placeholder="Enter room ID to join"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={createRoom}
            className="w-full"
            variant="default"
            size="lg"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            Create New Room
          </Button>
          <Button
            onClick={joinRoom}
            className="w-full"
            variant="secondary"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Join Existing Room
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Property of Javat 365</p>
      </div>
    </div>
  );
}
