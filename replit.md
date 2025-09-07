# ExpenseTracker

## Overview

ExpenseTracker is a personal finance management application built with React and Express.js. It helps users manage their expenses, income, debts, reminders, and provides AI-powered insights through Google Gemini AI integration. The application is designed with a focus on college students and provides conversational expense tracking with personalized financial recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool for fast development and hot module replacement
- **Routing**: Wouter for lightweight client-side routing with dedicated pages for dashboard, transactions, debts, reminders, and chat
- **State Management**: TanStack Query for server state management, caching, and data synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible and customizable components
- **Styling**: Tailwind CSS with custom design tokens, CSS variables for theming, and responsive design patterns
- **Forms**: React Hook Form with Zod validation for type-safe form handling and data validation
- **Charts**: Recharts library for data visualization including pie charts and bar charts for spending analysis
- **Navigation**: Responsive design with desktop sidebar and mobile bottom navigation

### Backend Architecture
- **Framework**: Express.js with TypeScript for type safety and better development experience
- **API Design**: RESTful APIs with comprehensive CRUD operations for accounts, transactions, debts, reminders, and chat messages
- **Data Layer**: Currently using in-memory storage (MemStorage class) that implements a standardized IStorage interface for future database integration
- **Validation**: Shared Zod schemas between frontend and backend ensuring consistent data validation across the application
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes and structured error responses
- **Development**: Vite integration for hot module replacement and efficient development workflow

### Data Storage Solutions
- **Database**: Configured for PostgreSQL using Drizzle ORM with Neon Database serverless platform
- **Schema**: Well-defined database schema with proper relationships, constraints, and enums for data integrity
- **Migration**: Drizzle Kit for database migrations and schema management
- **Current State**: Using in-memory storage with planned PostgreSQL integration (database structure already defined)
- **ORM**: Drizzle ORM chosen for type-safe database operations and excellent TypeScript integration

### Authentication and Authorization
- **Current State**: No authentication implemented - application currently operates without user management
- **Session Management**: Express session configuration present but not actively used
- **Security**: Basic CORS and request parsing middleware configured for development

### External Service Integrations
- **AI Services**: Google Gemini AI integration using both gemini-2.5-flash for real-time chat responses and gemini-2.5-pro for detailed spending analysis and insights
- **Font Loading**: Google Fonts integration for typography (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Development Tools**: Replit-specific development banner and error overlay plugins for enhanced development experience

## External Dependencies

### Core Technologies
- **React & TypeScript**: Frontend framework with type safety
- **Express.js**: Backend web framework
- **Vite**: Build tool and development server
- **Drizzle ORM**: Database toolkit and ORM

### Database & Storage
- **PostgreSQL**: Database (via Neon serverless)
- **Drizzle Kit**: Database migrations and schema management

### AI & Machine Learning
- **Google Gemini AI**: AI-powered financial insights and chat assistance

### UI & Design
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component library
- **shadcn/ui**: Pre-built component library
- **Recharts**: Chart and data visualization library
- **Lucide Icons**: Icon library

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation library
- **@hookform/resolvers**: Form validation integration

### State Management & Data Fetching
- **TanStack Query**: Server state management and caching

### Development Tools
- **TypeScript**: Type safety across the application
- **ESLint & Prettier**: Code linting and formatting (configured)
- **Replit Plugins**: Development environment integration

### Routing & Navigation
- **Wouter**: Lightweight client-side routing

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & class-variance-authority**: CSS class management
- **cmdk**: Command palette component