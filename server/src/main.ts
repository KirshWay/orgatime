import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

async function bootstrap() {
  const avatarsDir = join(__dirname, '..', 'uploads', 'avatars');
  const tasksImagesDir = join(__dirname, '..', 'uploads', 'tasks');

  if (!existsSync(avatarsDir)) {
    mkdirSync(avatarsDir, { recursive: true });
  }

  if (!existsSync(tasksImagesDir)) {
    mkdirSync(tasksImagesDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => {
          const constraints = error.constraints
            ? Object.values(error.constraints)
            : ['Validation failed'];
          return `${error.property}: ${constraints.join(', ')}`;
        });

        const message =
          formattedErrors.length > 0 ? formattedErrors : ['Validation error'];

        throw new HttpException(
          { message, statusCode: HttpStatus.BAD_REQUEST },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res: Response) => {
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.setHeader('Expires', new Date(Date.now() + 604800000).toUTCString());
    },
  });

  const config = new DocumentBuilder()
    .setTitle('OrgaTime API')
    .setDescription('API for OrgaTime')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = configService.get<number>('PORT') || 8000;
  await app.listen(PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
