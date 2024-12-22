import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, roomName } = req.body;

    if (!username || !roomName) {
      return res.status(400).json({ error: 'Username and room name are required.' });
    }

    try {
      const newRoom = await prisma.room.create({
        data: {
          name: roomName,
          owner: username,
          participants: {
            create: { username },
          },
        },
      });

      if (!newRoom || !newRoom.id || !newRoom.name) {
        console.log('fail')
        return res.status(500).json({ error: 'Failed to create room.' });
      }

      res.status(200).json({ roomId: newRoom.id, roomName: newRoom.name });
    } catch (error) {
        console.error('Error creating room:', error instanceof Error ? error.message : error);
        return res.status(500).json({ error: 'Failed to create room.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (req.method === 'GET') {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required and must be a string.' });
    }

    try {
      const rooms = await prisma.room.findMany({
        where: {
          participants: {
            some: { username },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      res.status(200).json(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error instanceof Error ? error.message : error);
      res.status(500).json({ error: 'Failed to fetch rooms.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
