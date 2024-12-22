import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { roomName } = req.query;

    if (!roomName || typeof roomName !== 'string') {
      return res.status(400).json({ error: 'Room name is required and should be a string' });
    }

    try {
      const room = await prisma.room.findUnique({
        where: {
          name: roomName,
        },
        include: {
            participants: true,
            messages: true,
          },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.status(200).json(room);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
