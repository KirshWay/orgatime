import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import {
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

const bootstrapLogger = new Logger('Bootstrap');

function ensureUploadDirectories(): string {
  const uploadsDir = join(__dirname, '..', 'uploads');
  const uploadSubdirectories = [
    join(uploadsDir, 'avatars'),
    join(uploadsDir, 'tasks'),
  ];

  for (const directory of uploadSubdirectories) {
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  }

  return uploadsDir;
}

async function registerFastifyPlugins(
  app: NestFastifyApplication,
  uploadsDir: string,
): Promise<void> {
  await app.register(fastifyCookie);
  await app.register(fastifyHelmet, {
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production' ? undefined : false,
  });
  await app.register(fastifyMultipart);
  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('Expires', new Date(Date.now() + 604800000).toUTCString());
      res.setHeader('Vary', 'Accept-Encoding');
    },
  });
}

function registerApiCacheHeaders(app: NestFastifyApplication): void {
  const fastify = app.getHttpAdapter().getInstance();

  fastify.addHook('onRequest', (request, reply, done) => {
    const requestUrl = request.raw.url ?? '';

    if (requestUrl === '/api' || requestUrl.startsWith('/api/')) {
      reply.header('Cache-Control', 'no-store');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
    }

    done();
  });
}

function configureApplication(
  app: NestFastifyApplication,
  configService: ConfigService,
  httpAdapterHost: HttpAdapterHost,
): void {
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
}

function setupSwagger(app: NestFastifyApplication): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('OrgaTime API')
    .setDescription('API for OrgaTime')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);
}

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  const uploadsDir = ensureUploadDirectories();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: 1,
    }),
  );
  const configService = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);

  await registerFastifyPlugins(app, uploadsDir);
  registerApiCacheHeaders(app);
  configureApplication(app, configService, httpAdapterHost);
  setupSwagger(app);

  const PORT = configService.get<number>('PORT') || 8000;
  await app.listen(PORT, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap().catch((err) => {
  bootstrapLogger.error('Error during bootstrap', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
