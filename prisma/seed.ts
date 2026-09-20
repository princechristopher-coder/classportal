import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@codeforge.academy';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const fullName = process.env.SEED_ADMIN_NAME || 'ClassPortal Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
      console.log(`Promoted existing user ${email} to ADMIN.`);
    } else {
      console.log(`Admin account ${email} already exists — nothing to do.`);
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { fullName, email, password: hashed, role: 'ADMIN' }
  });

  console.log(`Created admin account:`);
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log(`Log in with these, then change the password from /dashboard/settings.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
