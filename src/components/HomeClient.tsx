'use client';

import { useState } from 'react';
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
  const setUsername = useChatStore((state) => state.setUsername);
  const [username, setUsernameLocal] = useState('');
  const [roomId, setRoomId] = useState('');

  const createRoom = () => {
    if (!username.trim()) return;
    const newRoomId = Math.random().toString(36).substring(7);
    setUsername(username);
    router.push(`/chat/${newRoomId}`);
  };

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) return;
    setUsername(username);
    router.push(`/chat/${roomId}`);
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
