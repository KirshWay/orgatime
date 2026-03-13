# Orgatime - Task and Time Management System

<p align="center">
  <img src="./client/public/icon.png" alt="Orgatime Logo" width="150" height="150" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/node-22%2B-green" alt="Node" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-11-e0234e" alt="NestJS" />
</p>

Orgatime is a modern, full-featured task and time management application built with React and NestJS. It provides an intuitive interface for managing tasks, tracking time, and enhancing productivity through visual organization.

## ✨ Features

- **Visual Weekly Planner**: Drag-and-drop interface for planning your week with @dnd-kit
- **All Tasks View**: Browse all tasks grouped by date with status filtering
- **Someday Tasks**: Separate section for tasks without specific dates
- **Global Search**: Find any task instantly with `⌘K` / `Ctrl+K`
- **Subtasks Support**: Break down complex tasks into smaller, manageable pieces
- **Image Attachments**: Add images to tasks for better context and reference
- **Task Coloring**: Color-code tasks for visual categorization
- **User Authentication**: Secure login, registration, and profile management
- **Password Reset**: Admin-managed password recovery with secure one-time links
- **PWA**: Installable progressive web app with offline caching
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark/Light Themes**: Choose your preferred visual theme

## 🏗️ Architecture

The project follows a modern architecture with clear separation of concerns:

- **Frontend**: React 19 SPA following the Feature-Sliced Design methodology
- **Backend**: NestJS RESTful API with modular architecture
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Containerization**: Docker for consistent development and deployment
- **CI/CD**: GitHub Actions for automated deployment to Docker Swarm

## 🧪 Technology Stack

### Frontend
- React 19, TypeScript 5.9, Vite 8 (Rolldown)
- TailwindCSS 4, shadcn/ui components
- React Query, React Hook Form, Zod
- React Router, @dnd-kit
- React Compiler (babel-plugin-react-compiler)

### Backend
- NestJS 11, TypeScript 5.9
- Prisma ORM, PostgreSQL 17
- JWT Authentication with Passport
- File upload handling with Multer
- Sharp for image processing
- Swagger/OpenAPI documentation

### DevOps
- Docker & Docker Compose
- GitHub Actions for CI/CD
- Docker Swarm for orchestration
- Oxlint + Oxfmt for linting and formatting

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- Docker and Docker Compose
- pnpm

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/KirshWay/orgatime.git
   cd orgatime
   ```

2. **Run the development database**:
   ```bash
   docker compose -f server/compose.dev.yaml up -d
   ```

3. **Start the backend server**:
   ```bash
   cd server
   pnpm install
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm start:dev
   ```

4. **Start the frontend application**:
   ```bash
   cd client
   pnpm install
   pnpm dev
   ```

### Production Deployment
The application is configured for deployment with Docker Swarm:

```bash
docker stack deploy --with-registry-auth -c docker-compose.yml orgatime
```

## 📦 Versioning

The project uses a single version across both `client` and `server`. To bump the version:

```bash
bash scripts/bump-version.sh patch   # 1.0.0 → 1.0.1
bash scripts/bump-version.sh minor   # 1.0.0 → 1.1.0
bash scripts/bump-version.sh major   # 1.0.0 → 2.0.0
```

The script updates both `package.json` files, creates a commit with tag `vX.Y.Z`, and pushes to remote. Requires a clean working tree.

## 📚 Documentation

For more detailed information about each part of the project:
- [Frontend Documentation](./client/README.md)
- [Backend Documentation](./server/README.md)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
