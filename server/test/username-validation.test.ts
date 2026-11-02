import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { expect, test } from 'vitest';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UpdateProfileDto } from 'src/users/dto/update-profile.dto';

test('registration and profile updates enforce the same username policy', async () => {
  for (const username of [
    '',
    'a',
    'ab',
    'abc',
    'a'.repeat(21),
    'has space',
    'has-dash',
    'имя',
    null,
    123,
    'Ab_1',
    'a'.repeat(20),
  ]) {
    const registration = await validate(
      plainToInstance(RegisterDto, {
        email: 'user@example.com',
        password: 'Password1!',
        username,
      }),
    );
    const update = await validate(
      plainToInstance(UpdateProfileDto, { username }),
    );
    const valid = username === 'Ab_1' || username === 'a'.repeat(20);
    expect(registration.length === 0).toBe(valid);
    expect(update.length === 0).toBe(valid);
  }
});

test('profile updates can omit an unchanged legacy username', async () => {
  expect(
    await validate(
      plainToInstance(UpdateProfileDto, { email: 'new@example.com' }),
    ),
  ).toHaveLength(0);
});
