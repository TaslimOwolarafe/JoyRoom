import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomName } = req.query;  
  const { username } = req.body;   
  console.log(roomName, username)
  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ error: 'Room name is required.' });
  }

  if (req.method === 'POST') {
    console.log('POST')
    if (!username) {
      return res.status(400).json({ error: 'Username is required to add a participant.' });
    }

    console.log(username)
    try {
      const room = await prisma.room.findFirst({
        where: { name: roomName },
      });

      console.log(room)
      if (!room) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      const existingParticipant = await prisma.participant.findFirst({
        where: {
            username,
            roomId: room.id,
        },
      });

      if (existingParticipant) {
        return res.status(201).json({ message: 'User is already a participant' });
      }

      
      const participant = await prisma.participant.create({
        data: { username, roomId: room.id },  
      });

      return res.status(201).json(participant);
    } catch (error) {
      console.error('Error adding participant:', error);
      return res.status(500).json({ error: 'Failed to add participant' });
    }
  }

  if (req.method === 'DELETE') {
    if (!username) {
      return res.status(400).json({ error: 'Username is required to remove a participant' });
    }

    try {
      
      const room = await prisma.room.findFirstOrThrow({
        where: { name: roomName },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      
      const deletedParticipant = await prisma.participant.deleteMany({
        where: {
          username,
          roomId: room.id,  
        },
      });

      if (deletedParticipant.count === 0) {
        return res.status(404).json({ error: 'Participant not found in this room' });
      }

      return res.status(200).json({ message: 'Participant removed successfully' });
    } catch (error) {
      console.error('Error removing participant:', error);
      return res.status(500).json({ error: 'Failed to remove participant' });
    }
  }

  if (req.method === 'GET') {
    try {
      console.log(roomName)
      const room = await prisma.room.findFirstOrThrow({
        where: { name: roomName },
      });
      console.log(room)

      const participants = await prisma.participant.findMany({
        where: { roomId: room.id },
        select: {
          id: true,
          username: true,
        },
      });

      console.log(participants)

      return res.status(200).json(participants);
    } catch (error) {
      console.error('Error retrieving participants:', error);
      return res.status(500).json({ error: 'Failed to retrieve participants' });
    }
  }

  console.log('HTTP Method:', req.method);
  res.setHeader('Allow', ['POST', 'DELETE','GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}
