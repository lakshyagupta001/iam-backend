import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Delete legacy root@org.local if it exists to keep database clean
  await prisma.user.deleteMany({
    where: { email: 'root@org.local' },
  });

  // 1. Create Default Organization
  const org = await prisma.organization.upsert({
    where: { name: 'Change Networks' },
    update: {},
    create: {
      name: 'Change Networks',
    },
  });
  console.log(`Created organization: ${org.name}`);

  // 2. Create Root User
  const rootPassword = await bcrypt.hash('Pass@123', 10);
  const rootUser = await prisma.user.upsert({
    where: { email: 'root@org.com' },
    update: {
      passwordHash: rootPassword,
      organizationId: org.id,
    },
    create: {
      name: 'Root',
      email: 'root@org.com',
      passwordHash: rootPassword,
      isRoot: true,
      organizationId: org.id,
    },
  });
  console.log(`Created root user: ${rootUser.email}`);

  // 3. Create requested Indian user example
  const vikasPassword = await bcrypt.hash('Pass@123', 10);
  const vikasUser = await prisma.user.upsert({
    where: { email: 'vikasojha@changenetworks.com' },
    update: {
      passwordHash: vikasPassword,
      organizationId: org.id,
    },
    create: {
      name: 'Vikas Ojha',
      email: 'vikasojha@changenetworks.com',
      passwordHash: vikasPassword,
      isRoot: false,
      organizationId: org.id,
    },
  });
  console.log(`Created user: ${vikasUser.email}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
