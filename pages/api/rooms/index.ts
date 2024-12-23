import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, roomName } = req.body;

    console.log(username, roomName);
    if (!username || !roomName) {
      return res.status(400).json({ error: 'Username and room name are required.' });
    }

    try {
      console.log('1');
      const newRoom = await prisma.room.create({
        data: {
          name: roomName,
          owner: username,
          participants: {
            create: { username },
          },
        },
      });
      console.log('2');

      if (!newRoom || !newRoom.id || !newRoom.name) {
        console.log('fail');
        return res.status(500).json({ error: 'Failed to create room.' });
      }

      res.status(200).json({ roomId: newRoom.id, roomName: newRoom.name });
    } catch (error) {
        console.error('Error creating room:', error instanceof Error ? error.message : error);
        return res.status(500).json({ error: 'Failed to create room.' });
    }
  }

  if (req.method === 'GET') {
    const { username } = req.query;
    console.log('ppp', username);

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required and must be a string.' });
    }

    try {
      console.log(1);
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
      console.log(rooms);
      console.log(2);

      res.status(200).json(rooms);  // Return rooms without wrapping in an array
    } catch (error) {
      console.error('Error fetching rooms:', error instanceof Error ? error.message : error);
      res.status(500).json({ error: 'Failed to fetch rooms.' });
    }
  }
}
