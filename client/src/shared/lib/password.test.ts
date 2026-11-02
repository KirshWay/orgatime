import { expect, test } from 'vitest';

import { newPasswordSchema } from './password';

test('new passwords require all character classes and at most 72 UTF-8 bytes', () => {
  expect(newPasswordSchema.safeParse('Valid!12').success).toBe(true);
  expect(newPasswordSchema.safeParse('Aa1!' + 'a'.repeat(68)).success).toBe(
    true,
  );
  expect(newPasswordSchema.safeParse('Aa1!' + 'a'.repeat(69)).success).toBe(
    false,
  );
  expect(newPasswordSchema.safeParse('Aa1!' + 'я'.repeat(34)).success).toBe(
    true,
  );
  expect(newPasswordSchema.safeParse('Aa1!' + 'я'.repeat(35)).success).toBe(
    false,
  );
  for (const value of [
    'lowercase1!',
    'UPPERCASE1!',
    'NoNumbers!',
    'NoSymbols12',
    'Aa1!',
  ]) {
    expect(newPasswordSchema.safeParse(value).success).toBe(false);
  }
});

test('minimum password length counts Unicode code points', () => {
  expect(newPasswordSchema.safeParse('Aa1!😀😀').success).toBe(false);
  expect(newPasswordSchema.safeParse('Aa1!😀😀😀').success).toBe(false);
  expect(newPasswordSchema.safeParse('Aa1!😀😀😀😀').success).toBe(true);
});
