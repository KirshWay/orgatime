import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

type CliArgs = {
  email?: string;
  ttlMinutes: number;
};

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = { ttlMinutes: 60 };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    const next = argv[i + 1];

    if (current === '--email' && next) {
      args.email = next;
      i += 1;
      continue;
    }

    if (current === '--ttl-minutes' && next) {
      const ttl = Number.parseInt(next, 10);
      if (Number.isNaN(ttl) || ttl <= 0) {
        throw new Error('Invalid --ttl-minutes value. Use a positive integer.');
      }
      args.ttlMinutes = ttl;
      i += 1;
    }
  }

  return args;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }

  if (local.length <= 2) {
    return `***@${domain}`;
  }

  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function buildResetUrl(token: string): string {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const normalizedFrontendUrl = frontendUrl.endsWith('/')
    ? frontendUrl
    : `${frontendUrl}/`;

  return `${normalizedFrontendUrl}auth/reset-password?token=${token}`;
}

async function run(): Promise<void> {
  const { email, ttlMinutes } = parseCliArgs(process.argv.slice(2));

  if (!email) {
    throw new Error('Missing required argument: --email <user@example.com>');
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
      },
    });

    const resetUrl = buildResetUrl(resetToken);

    console.log(
      `[admin-reset-link] Generated reset link for ${maskEmail(email)} at ${new Date().toISOString()}`,
    );
    console.log(`[admin-reset-link] Expires at: ${expires.toISOString()}`);
    console.log(resetUrl);
  } finally {
    await prisma.$disconnect();
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[admin-reset-link] ${message}`);
  process.exit(1);
});
