# Orgatime - Frontend

<p align="center">
  <img src="./public/images/icon.png" alt="Orgatime Logo" width="120" height="120" />
</p>

The frontend of Orgatime is built with modern React and follows the Feature-Sliced Design architecture for maintainable and scalable code organization.

## 🧪 Technology Stack

- **Core**: React 19, TypeScript 5, Vite 5
- **State Management**: React Query, Context API, Zustand
- **Routing**: React Router 6
- **UI Components**: 
  - TailwindCSS for styling
  - shadcn/ui for component primitives
  - Lucide React for icons
- **Forms & Validation**: 
  - React Hook Form for form state
  - Zod for schema validation
- **Drag & Drop**: react-dnd-kit
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast
- **Image Handling**: Browser native APIs with custom hooks

## 🏗️ Architecture (Feature-Sliced Design)

The project follows Feature-Sliced Design methodology for clear separation of concerns:

```
/src
  /app         # Application entry, providers setup, global styles
  /pages       # Page components and routes
  /widgets     # Complex UI blocks combining multiple features
  /features    # User scenarios, business logic implementations
  /entities    # Business entities (task, user, etc.)
  /shared      # Shared UI components, utils, and types
```

### Key Layers

- **app**: Contains global providers, router setup, and application initialization
- **pages**: Page components that compose widgets and features
- **widgets**: Complex UI blocks like Header, TaskWeek, Someday section
- **features**:
  - **auth**: Authentication, registration, password reset
  - **tasks**: Task management (create, update, delete, drag-n-drop)
  - **settings**: User profile, theme settings, notifications
  - **search**: Global search functionality
- **entities**: Reusable business entities (Task, User)
- **shared**: UI components, utility functions, API client setup

## 📱 Key Features

### Task Management

- Visual weekly planner with drag and drop functionality
- "Someday" section for tasks without specific dates
- Task creation, editing, and deletion
- Subtasks with completion tracking
- Task coloring for visual categorization
- Image attachments with preview functionality

### User Experience

- Responsive design for mobile and desktop
- Dark/light theme support
- Smooth animations and transitions
- Offline detection and recovery
- Form validations with helpful error messages
- Toast notifications for user actions

### Authentication & Security

- JWT-based authentication
- Secure profile management
- Password reset flow
- Protected routes
- CSRF protection

## 🚀 Development

### Environment Variables

Create a `.env` file with the following variables:

```
VITE_BACKEND_URL=http://localhost:8000
VITE_SITE_DOMAIN=http://localhost:3000
```

### Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Format code
pnpm format
```

## 🧩 Component Architecture

Components follow a consistent pattern:

- Functional components with TypeScript interfaces
- Custom hooks for business logic separation
- Early return pattern for conditional rendering
- Composition over inheritance
- Prop destructuring with defaults

Example component structure:
```tsx
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { useTaskActions } from '@/features/tasks/hooks/useTaskActions';
import type { Task } from '@/entities/task/model/types';

interface TaskItemProps {
  task: Task;
  isEditable?: boolean;
}

export const TaskItem = ({ task, isEditable = false }: TaskItemProps) => {
  const { updateTask, deleteTask } = useTaskActions();
  const [isEditing, setIsEditing] = useState(false);
  
  // Business logic...
  
  return (
    <div className="task-item">
      {/* Component JSX */}
    </div>
  );
};
```

## 📂 Project Structure

The project structure follows Feature-Sliced Design with a clear separation of concerns:

```
/src
  /app
    /providers      # Global providers (auth, query, theme)
    /styles         # Global styles
    App.tsx         # Main application component
    main.tsx        # Entry point
  /pages
    /auth           # Auth pages (login, register, etc.)
    /home           # Main application page
    /landing        # Landing page for non-authenticated users
    /not-found      # 404 page
  /widgets
    /header         # Application header
    /week           # Weekly task view
    /someday        # Someday task section
  /features
    /auth           # Authentication-related features
      /api          # API calls
      /hooks        # Custom hooks
      /ui           # UI components
    /tasks          # Task-related features
      /api          # API calls
      /hooks        # Custom hooks
      /lib          # Helper functions
      /model        # Types and constants
      /ui           # UI components
    /settings       # User settings features
  /entities
    /task           # Task entity
      /model        # Types and constants
    /user           # User entity
  /shared
    /api            # API client setup
    /hooks          # Shared hooks
    /lib            # Utility functions
    /ui             # Reusable UI components
    /styles         # Shared styles
```
