# Orgatime - Client Side

The client side of the Orgatime application is built with React, TypeScript, and Vite using modern tools and libraries.

## Technology Stack

- **React** - library for building user interfaces
- **TypeScript** - statically typed programming language
- **Vite** - modern build tool and development server
- **React Router** - for application routing
- **Zod** - for form and data validation
- **React Hook Form** - for form management
- **React Query** - for state management and data caching
- **Tailwind CSS** - for component styling
- **React Helmet** - for managing headers and SEO
- **React Hot Toast** - for notifications

## Project Architecture

The project follows Feature Sliced Design architecture:

- `/src/app` - application initialization and common settings
- `/src/pages` - page components
- `/src/features` - business functionality of the application
- `/src/entities` - business entities
- `/src/shared` - common components and utilities

## Running the Project

```bash
# Installing dependencies
npm install

# Running in development mode
npm run dev

# Building for production
npm run build

# Local preview of production build
npm run preview
```

## Features

- User authentication and registration
- Password recovery
- Task and subtask management
- Project management
- Time tracking for tasks
- Image handling in tasks
- Dark and light themes
- Responsive design

## NPM Scripts

- `dev`: Start development server
- `build`: Build for production with type checking
- `preview`: Preview production build
- `lint`: Run eslint
- `lint:fix`: Fix eslint issues
- `format`: Format code with prettier
