import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { expect, test } from 'vitest';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';

const candidates = [
  {
    dto: RegisterDto,
    field: 'password',
    defaults: { email: 'user@example.com', username: 'test_user' },
  },
  {
    dto: ResetPasswordDto,
    field: 'newPassword',
    defaults: { token: 'test-reset-token' },
  },
  {
    dto: ChangePasswordDto,
    field: 'newPassword',
    defaults: { oldPassword: 'oldPassword1!' },
  },
];

test.each(candidates)(
  'new passwords enforce 72 UTF-8 bytes with linear character checks in $dto.name',
  async ({ dto, field, defaults }) => {
    const errors = (value: string) =>
      validate(
        plainToInstance(dto as typeof RegisterDto, {
          ...defaults,
          [field]: value,
        }),
      );
    expect(await errors('Aa1!😀😀')).not.toHaveLength(0);
    expect(await errors('Aa1!😀😀😀')).not.toHaveLength(0);
    expect(await errors('Aa1!😀😀😀😀')).toHaveLength(0);
    expect(await errors('Aa1!' + 'x'.repeat(68))).toHaveLength(0);
    expect(await errors('Aa1!' + 'é'.repeat(34))).toHaveLength(0);
    expect(await errors('Aa1!' + 'x'.repeat(69))).not.toHaveLength(0);
    expect(await errors('Aa1!' + 'é'.repeat(35))).not.toHaveLength(0);
    expect(await errors('Aa1!' + '😀'.repeat(18))).not.toHaveLength(0);
    expect(await errors('a'.repeat(1000000))).not.toHaveLength(0);
    for (const password of [
      'nouppercase1!',
      'NOLOWERCASE1!',
      'MissingNumber!',
      'MissingSpecial1',
      'Aa1!',
    ]) {
      expect(await errors(password)).not.toHaveLength(0);
    }
  },
);

test('legacy long login and current passwords remain accepted', async () => {
  const password = 'Aa1!' + 'x'.repeat(1000);
  expect(
    await validate(
      plainToInstance(LoginDto, { email: 'user@example.com', password }),
    ),
  ).toHaveLength(0);
  expect(
    await validate(
      plainToInstance(ChangePasswordDto, {
        oldPassword: password,
        newPassword: 'NewPassword1!',
      }),
    ),
  ).toHaveLength(0);
});

test('registration rejects avatar and other non-whitelisted properties', async () => {
  const dto = plainToInstance(RegisterDto, {
    email: 'user@example.com',
    username: 'test_user',
    password: 'Password1!',
    avatar: '/uploads/avatars/other.webp',
  });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  expect(errors.some((error) => error.property === 'avatar')).toBe(true);
});
