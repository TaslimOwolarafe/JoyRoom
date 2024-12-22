import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomName } = req.query;
  const { username } = req.body;

  if (!roomName || typeof roomName !== 'string' || !username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Room name and username are required.' });
  }

  if (req.method === 'POST') {
    try {
  
      const room = await prisma.room.findUnique({
        where: { name: roomName },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

  
      await prisma.participant.updateMany({
        where: { roomId: room.id, username },
        data: { lastAccessed: new Date() },
      });

      res.status(200).json({ message: 'Last accessed updated successfully' });
    } catch (error) {
      console.error('Error updating last accessed:', error);
      res.status(500).json({ error: 'Error updating last accessed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
