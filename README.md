# Orgatime - Task and Time Management System

Orgatime is a full-featured web application for task, time, and project management. The application consists of a client-side (React) and a server-side (NestJS).

## Features

- Task and subtask management
- Time tracking
- Image handling in tasks
- User authentication and authorization
- Password reset via email
- Dark and light themes

## Project Structure

- `/client` - Frontend built with React/TypeScript/Vite
- `/server` - Backend built with NestJS/TypeScript/Prisma

## Development Setup

### Running the Database with Docker Compose:

```bash
docker compose -f compose.dev.yaml up --build -d
```

### Running the Server:

```bash
cd server
npm install
npm run start:dev
```

### Running the Client:

```bash
cd client
npm install
npm run dev
```

## Documentation

Detailed documentation for each part of the project is available in the respective folders:
- [Client Documentation](/client/README.md)
- [Server Documentation](/server/README.md)
