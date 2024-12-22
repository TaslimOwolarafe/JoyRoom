import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Connect the client
  await prisma.$connect();
  // ... our Prisma client queries would go here.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })