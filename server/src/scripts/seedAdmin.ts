import { connectDB, disconnectDB } from '../config/db';
import { User } from '../modules/auth/auth.model';
import { hashPassword } from '../utils/password';

async function main(): Promise<void> {
  const [email, password, name = 'Administrator'] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npm run seed:admin -- <email> <password> [name]');
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }

  await connectDB();

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`Promoted existing user ${normalizedEmail} to admin.`);
      return;
    }

    const passwordHash = await hashPassword(password);
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
    });
    console.log(`Created admin ${normalizedEmail}.`);
  } finally {
    await disconnectDB();
  }
}

void main().catch(async (error) => {
  console.error('[seed:admin] Failed:', error);
  await disconnectDB();
  process.exitCode = 1;
});
