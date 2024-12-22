import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomId, messageIds, username } = req.body;

  if (req.method === 'POST') {
    try {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          roomId: roomId,
        },
        data: {
          readBy: {
            push: username,
          },
        },
      });

      res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Error marking messages as read' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
