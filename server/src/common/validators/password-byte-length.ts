import { registerDecorator, type ValidationOptions } from 'class-validator';

export function PasswordByteLength(options?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'passwordByteLength',
      target: target.constructor,
      propertyName,
      options: {
        message: 'Password must not exceed 72 UTF-8 bytes',
        ...options,
      },
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72
          );
        },
      },
    });
  };
}
