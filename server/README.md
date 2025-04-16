# Orgatime - Server Side

The server side of the Orgatime application is built with NestJS, TypeScript, and Prisma ORM for working with PostgreSQL database.

## Technology Stack

- **NestJS** - progressive Node.js framework for building efficient and scalable server-side applications
- **TypeScript** - statically typed programming language
- **Prisma ORM** - modern ORM for database operations
- **PostgreSQL** - relational database
- **JWT** - for authentication and authorization
- **Passport** - for authentication strategies
- **Node-mailer** - for sending emails
- **Multer** - for file uploads

## Project Architecture

The project follows the modular architecture of NestJS:

- `/src/main.ts` - application entry point
- `/src/app.module.ts` - root application module
- `/src/auth` - authentication and authorization module
- `/src/users` - user management module
- `/src/tasks` - task management module
- `/src/projects` - project management module
- `/src/common` - common components, decorators, guards, etc.
- `/prisma` - Prisma schema and migrations

## Running the Project

```bash
# Installing dependencies
npm install

# Running in development mode
npm run start:dev

# Building the project
npm run build

# Running in production mode
npm run start:prod
```

## Database and Prisma

The project uses Prisma ORM for working with PostgreSQL. The Prisma schema is located in the `prisma/schema.prisma` file.

```bash
# Applying migrations
npx prisma migrate dev

# Generating Prisma client
npx prisma generate

# Viewing database data
npx prisma studio
```

## API Endpoints

Main API endpoints:

- **Auth**: `/api/auth` - registration, authorization, token refresh
- **Users**: `/api/users` - user management
- **Tasks**: `/api/tasks` - CRUD operations with tasks
- **Projects**: `/api/projects` - CRUD operations with projects
- **Images**: `/api/images` - uploading and managing images
