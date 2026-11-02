import { expect, test } from 'vitest';

import { createSettingsSchema, settingsSchema } from './validation';

const profile = {
  username: 'abcd',
  email: 'user@example.com',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

test('a username accepted at registration can save profile settings', () => {
  expect(settingsSchema.safeParse(profile).success).toBe(true);
  expect(settingsSchema.safeParse({ ...profile, username: 'ab' }).success).toBe(
    false,
  );
});

test('new usernames use the same policy in settings and registration', () => {
  for (const username of [
    '',
    'a',
    'ab',
    'abc',
    'a'.repeat(21),
    'has space',
    'has-dash',
    'имя',
  ]) {
    expect(settingsSchema.safeParse({ ...profile, username }).success).toBe(
      false,
    );
  }
  for (const username of ['Ab_1', 'a'.repeat(20)]) {
    expect(settingsSchema.safeParse({ ...profile, username }).success).toBe(
      true,
    );
  }
});

test('an unchanged legacy username does not block other settings', () => {
  const schema = createSettingsSchema('abc');
  expect(schema.safeParse({ ...profile, username: 'abc' }).success).toBe(true);
  expect(schema.safeParse({ ...profile, username: 'xy' }).success).toBe(false);
});
