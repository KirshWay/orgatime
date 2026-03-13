# Orgatime - Frontend

<p align="center">
  <img src="./public/icon.png" alt="Orgatime Logo" width="120" height="120" />
</p>

The frontend of Orgatime is built with modern React and follows the Feature-Sliced Design architecture for maintainable and scalable code organization.

## 🧪 Technology Stack

- **Core**: React 19, TypeScript 5.9, Vite 8 (Rolldown)
- **State Management**: React Query, Zustand
- **Routing**: React Router 7
- **UI Components**:
  - TailwindCSS 4 for styling
  - shadcn/ui for component primitives
  - Lucide React for icons
- **Forms & Validation**:
  - React Hook Form for form state
  - Zod for schema validation
- **Drag & Drop**: @dnd-kit
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast
- **PWA**: vite-plugin-pwa with Workbox caching
- **Optimization**: React Compiler (babel-plugin-react-compiler)
- **Linting & Formatting**: Oxlint, Oxfmt

## 🏗️ Architecture (Feature-Sliced Design)

The project follows Feature-Sliced Design methodology for clear separation of concerns:

```
/src
  /app         # Application entry, providers setup
  /pages       # Page components and routes
  /widgets     # Complex UI blocks combining multiple features
  /features    # User scenarios, business logic implementations
  /entities    # Business entities (task)
  /shared      # Shared UI components, utils, and types
```

### Key Layers

- **app**: Contains global providers, router setup, and application initialization
- **pages**: Page components that compose widgets and features
- **widgets**: Complex UI blocks like Header, Week view, Someday section, All Tasks list
- **features**:
  - **auth**: Authentication, registration, password reset
  - **tasks**: Task management (create, update, delete, drag-n-drop)
  - **settings**: User profile, theme settings
  - **search**: Global search functionality (⌘K)
- **entities**: Reusable business entities (Task)
- **shared**: UI components, utility functions, API client setup

## 📱 Key Features

### Task Management

- Visual weekly planner with drag and drop functionality
- All tasks view with date grouping and status filtering (all/active/completed)
- "Someday" section for tasks without specific dates
- Task creation, editing, and deletion
- Subtasks with completion tracking
- Task coloring for visual categorization
- Image attachments with preview functionality
- Global search with `⌘K` / `Ctrl+K`

### User Experience

- Progressive Web App (installable, service worker caching)
- Responsive design for mobile and desktop
- Dark/light theme support
- Smooth animations and transitions (Motion)
- Form validations with helpful error messages
- Toast notifications for user actions

### Authentication & Security

- JWT-based authentication
- Secure profile management
- Password reset flow (admin-managed one-time links)
- Protected routes

<details>
<summary>📊 State Management with Zustand</summary>

### Store Structure

Stores are organized following the FSD principles:

- Entity-specific state (user profile, etc.) is in `entities/**/model`
- Feature-specific state is in `features/**/model`
- Shared global state is in `shared/stores`

### Zustand DevTools Integration

All stores are configured with Redux DevTools middleware for better debugging:

```tsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STORE_NAMES } from '@/shared/lib/store';

type MyStore = {
  // your types here
};

export const useMyStore = create<MyStore>()(
  devtools(
    (set) => ({
      // state and actions
      myAction: () =>
        set(
          {
            /* new state */
          },
          false,
          'storeName/actionName',
        ),
    }),
    { name: STORE_NAMES.MY_STORE },
  ),
);
```

### Action Naming Convention

To improve debugging, each action has a unique name passed as the third parameter to the `set` function:

```tsx
// bad practice
set({ count: state.count + 1 });

// good practice
set({ count: state.count + 1 }, false, 'counter/increment');
```

Recommended format: `[feature]/[action]`

### Store Names

For consistency, store names are defined as constants in `STORE_NAMES`:

```tsx
export const STORE_NAMES = {
  USER_STORE: 'UserStore',
  WEEK_STORE: 'WeekStore',
};
```

</details>

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

# Auto-fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Debugging with Redux DevTools

1. Install the Redux DevTools extension for your browser:
   - [Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

2. Open the developer tools in your browser and navigate to the Redux tab
3. Select the store you want to inspect from the dropdown menu
4. Track state changes and action history in real-time

<details>
<summary>🧩 Component Architecture</summary>

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
import { useUpdateTask, useDeleteTask } from '@/features/tasks/hooks';
import type { Task } from '@/entities/task/model/types';

interface TaskItemProps {
  task: Task;
  isEditable?: boolean;
}

export const TaskItem = ({ task, isEditable = false }: TaskItemProps) => {
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const [isEditing, setIsEditing] = useState(false);

  // Business logic...

  return <div className="task-item">{/* Component JSX */}</div>;
};
```

</details>

<details>
<summary>📂 Project Structure</summary>

```
/src
  /app
    /providers      # Global providers (auth, query, theme)
    App.tsx         # Main application component
    main.tsx        # Entry point
  /pages
    /all-tasks      # All tasks page with date grouping and filtering
    /auth           # Auth pages (login, register, etc.)
    /home           # Main application page
    /landing        # Landing page for non-authenticated users
    /not-found      # 404 page
  /widgets
    /all-tasks      # All tasks list, date groups, and filter controls
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
    /search         # Global search feature
    /settings       # User settings features
  /entities
    /task           # Task entity
      /model        # Types and constants
  /shared
    /api            # API client setup
    /hooks          # Shared hooks
    /lib            # Utility functions
    /stores         # Zustand stores
    /styles         # Shared styles
    /ui             # Reusable UI components (shadcn/ui)
```

</details>
