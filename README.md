# Orgatime - Task and Time Management System

<p align="center">
  <img src="./client/public/icon.png" alt="Orgatime Logo" width="150" height="150" />
</p>

Orgatime is a modern, full-featured task and time management application built with React and NestJS. It provides an intuitive interface for managing tasks, tracking time, and enhancing productivity through visual organization.

## ✨ Features

- **Task Management**: Create, edit, and organize tasks with customizable properties
- **Visual Weekly View**: Drag-and-drop interface for planning your week
- **Someday Tasks**: Separate section for tasks without specific dates
- **Subtasks Support**: Break down complex tasks into smaller, manageable pieces
- **Image Attachments**: Add images to tasks for better context and reference
- **Task Coloring**: Color-code tasks for visual categorization
- **User Authentication**: Secure login, registration, and profile management
- **Password Reset**: Self-service password recovery via email
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark/Light Themes**: Choose your preferred visual theme

## 🏗️ Architecture

The project follows a modern architecture with clear separation of concerns:

- **Frontend**: React-based SPA following the Feature-Sliced Design methodology
- **Backend**: NestJS RESTful API with modular architecture
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Containerization**: Docker for consistent development and deployment
- **CI/CD**: GitHub Actions for automated deployment to Docker Swarm

## 🧪 Technology Stack

### Frontend
- React, TypeScript, Vite
- TailwindCSS, shadcn/ui components
- React Query, React Hook Form, Zod
- React Router, React DnD

### Backend
- NestJS, TypeScript
- Prisma ORM, PostgreSQL
- JWT Authentication
- File upload handling with Multer
- Sharp for image processing

### DevOps
- Docker & Docker Compose
- GitHub Actions for CI/CD
- Docker Swarm for orchestration

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- pnpm (recommended) or npm

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/orgatime.git
   cd orgatime
   ```

2. **Run the development database**:
   ```bash
   docker compose -f compose.dev.yaml up -d
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

## 📚 Documentation

For more detailed information about each part of the project:
- [Frontend Documentation](./client/README.md)
- [Backend Documentation](./server/README.md)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
