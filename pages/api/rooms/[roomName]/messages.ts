// /pages/api/rooms/[roomName]/messages.ts
import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomName } = req.query;

  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ error: 'Room name is required.' });
  }

  if (req.method === 'POST') {
    const { content, sender } = req.body;

    if (!content || !sender) {
      return res.status(400).json({ error: 'Content and sender are required.' });
    }

    try {
      const room = await prisma.room.findUnique({
        where: { name: roomName },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      const message = await prisma.message.create({
        data: { content, sender, roomId: room.id },
      });

      return res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
