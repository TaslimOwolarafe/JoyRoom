import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomName } = req.query;
  const { username } = req.query;

  if (!roomName || typeof roomName !== 'string' || !username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Room name and username are required.' });
  }

  if (req.method === 'GET') {
    try {
  
      const room = await prisma.room.findUnique({
        where: { name: roomName },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

  
      const participant = await prisma.participant.findFirst({
        where: { roomId: room.id, username: username },
      });

      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }

  
      const unreadCount = await prisma.message.count({
        where: {
          roomId: room.id,
          createdAt: { gt: participant.lastAccessed },
        },
      });

      res.status(200).json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Error fetching unread count' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
