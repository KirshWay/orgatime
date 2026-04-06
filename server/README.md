# Orgatime - Backend

<p align="center">
  <img src="../client/public/icon.png" alt="Orgatime Logo" width="120" height="120" />
</p>

The backend of Orgatime is built with NestJS, providing a robust foundation for the API with modular architecture, TypeScript support, and enterprise-grade features.

## 🧪 Technology Stack

- **Core Framework**: NestJS 11, TypeScript 5.9
- **Database**:
  - PostgreSQL 17
  - Prisma ORM 6.x for type-safe database operations
- **Authentication**:
  - JWT for token-based authentication
  - bcrypt for password hashing
  - Passport strategies
- **File Management**:
  - Fastify multipart for file uploads
  - Sharp for image processing (WebP conversion)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator and class-transformer
- **Linting & Formatting**: Oxlint, Oxfmt

## 🏗️ Architecture

The backend follows NestJS modular architecture, with clear separation of concerns:

```
/src
  /auth          # Authentication, authorization, JWT strategies
  /users         # User management
  /tasks         # Task-related functionality
  /common        # Shared decorators, filters, and utilities
  /prisma        # Prisma service and schema
  /utils         # Utility functions and helpers
  /scripts       # Admin CLI scripts
  main.ts        # Application entry point
  app.module.ts  # Root application module
```

### Module Structure

Each feature module (auth, users, tasks) follows a consistent pattern:

- **Controller**: Handles HTTP requests and defines routes
- **Service**: Contains business logic
- **DTO**: Data Transfer Objects for validation
- **Entities**: TypeScript interfaces matching Prisma models

## 📊 Database Schema

The database schema is defined using Prisma and includes these main entities:

- **User**: User accounts and authentication
- **Task**: Core task entity with properties like title, description, date, color, order
- **Subtask**: Child tasks belonging to a parent task
- **TaskImage**: Images attached to tasks (stored as WebP)

## 🔐 Security Features

- JWT-based authentication with refresh tokens (1h access, 7d refresh)
- Password hashing with bcrypt
- Password reset with secure one-time tokens (admin-generated)
- Login brute-force protection (5 attempts, 15-minute lockout)
- Password reset cooldown (3 minutes between requests)
- Secure cookie handling (`sameSite: strict`, `secure`, `httpOnly`)
- CORS configuration
- Input validation using DTOs and class-validator

## 🚀 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in and get access token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Log out and invalidate tokens
- `POST /api/auth/forgot-password` - Request password reset (directs to support)
- `POST /api/auth/reset-password` - Reset password with one-time token

### Users

- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload user avatar
- `POST /api/users/change-password` - Change user password

### Tasks

- `GET /api/tasks` - Get all tasks for the authenticated user
- `GET /api/tasks/:id` - Get specific task with subtasks and images
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (cascades to subtasks and images)
- `PATCH /api/tasks/order` - Batch update task order and due dates
- `PATCH /api/tasks/:id/date` - Update task date (tomorrow, next week, someday, custom)
- `POST /api/tasks/:id/duplicate` - Duplicate task with subtasks and images
- `POST /api/tasks/search` - Full-text search across task titles, descriptions, and subtasks

### Task Images

- `POST /api/tasks/:id/images` - Upload images to task
- `GET /api/tasks/:id/images` - Get task images
- `DELETE /api/tasks/:id/images/:imageId` - Remove image from task

### Subtasks

- `POST /api/tasks/:id/subtasks` - Add subtask
- `PATCH /api/tasks/subtasks/:id` - Update subtask
- `DELETE /api/tasks/subtasks/:id` - Delete subtask

## 🛠️ Development

### Environment Variables

Create a `.env` file with the following variables:

```
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/orgatime-dev?schema=public"

# Authentication
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:3000"
SUPPORT_EMAIL="support@example.com"

# App Settings
PORT=8000
NODE_ENV=development
```

### Commands

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Start development server
pnpm start:dev

# Build for production
pnpm build

# Run in production mode
pnpm start:prod

# Lint code
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Generate manual password reset link (after build)
pnpm admin:reset-link -- --email user@example.com --ttl-minutes 60

# Run database migrations in production
pnpm prisma:migrate:deploy
```

<details>
<summary>🔧 Manual Password Recovery (Runbook)</summary>

When automatic email delivery is unavailable, use manual recovery via support.

### 1. User flow

1. User opens `Forgot password`
2. User is asked to contact support (`SUPPORT_EMAIL`)
3. Support operator generates a one-time reset link manually
4. Operator sends link to user via support email
5. User resets password on `/auth/reset-password`

### 2. Generate reset link in production container

```bash
# connect to host
ssh <your-user>@<your-host>

# find backend container
docker ps --filter "name=server"

# open shell in backend container
docker exec -it <server-container-id> sh

# generate reset link (valid for 60 minutes by default)
pnpm admin:reset-link -- --email user@example.com --ttl-minutes 60
```

The command prints:

- masked audit line
- expiry timestamp
- one-time reset URL (send this URL to the user manually)

</details>

## 🐳 Docker Support

The backend includes Docker configuration for easy deployment:

- `Dockerfile` - Multi-stage build for production (Node 22 Alpine)
- `docker-entrypoint.sh` - Entry script for container initialization
- `compose.dev.yaml` - Development setup with PostgreSQL

<details>
<summary>🧩 Code Structure Example</summary>

Controller example:

```typescript
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: Request) {
    return this.tasksService.findAllTasks(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: Request, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(req.user.id, createTaskDto);
  }

  // Additional endpoints...
}
```

Service example:

```typescript
@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAllTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      include: {
        subtasks: true,
        images: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Additional methods...
}
```

</details>

## 📝 API Documentation

The API is documented using Swagger, available at `/api/docs` when running the server.
