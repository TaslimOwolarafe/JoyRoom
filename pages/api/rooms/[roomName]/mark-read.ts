// /pages/api/rooms/[roomName]/messages.ts
import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomName } = req.query;
  const { username } = req.body;

  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ error: 'Room name is required.' });
  }

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required.' });
  }

  if (req.method === 'POST') {
    try {
      const room = await prisma.room.findUnique({
        where: { name: roomName },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      // Update messages to mark as read by the username
      await prisma.message.updateMany({
        where: {
          roomId: room.id,
          NOT: { readBy: { has: username } },
        },
        data: {
          readBy: {
            push: username,
          },
        },
      });

      res.status(200).json({ message: 'Messages marked as read successfully' });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Error marking messages as read' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
