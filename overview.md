# ExpenseTracker

## Overview
ExpenseTracker is a personal finance management application built with React and Express.js. It helps users manage their expenses, income, debts, reminders, and provides AI-powered insights through a chat interface. The application features a modern, responsive design using shadcn/ui components and supports multiple account types for comprehensive financial tracking.

## Recent Changes
- **August 23, 2025**: Migrated AI service from Anthropic to Google Gemini AI for improved financial insights and student-focused recommendations
- **AI Integration**: Now using gemini-2.5-flash for real-time chat responses and gemini-2.5-pro for detailed spending analysis
- **Enhanced Features**: Improved conversational expense tracking and personalized financial recommendations for college students

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for dashboard, transactions, debts, reminders, and chat
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and responsive design patterns
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts for data visualization (pie charts, bar charts for spending analysis)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful APIs with comprehensive CRUD operations for all entities
- **Data Layer**: Currently using in-memory storage (MemStorage class) that implements a standardized IStorage interface
- **Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Development**: Vite integration for hot module replacement in development mode

### Data Storage Solutions
- **Database**: Configured for PostgreSQL using Drizzle ORM with Neon Database serverless
- **Schema**: Well-defined database schema with proper relationships and constraints
- **Migration**: Drizzle Kit for database migrations and schema management
- **Current State**: Using in-memory storage with planned PostgreSQL integration

### Authentication and Authorization
- **Current State**: No authentication implemented
- **Session Management**: Express session configuration present but not actively used
- **Security**: Basic CORS and request parsing middleware configured

### External Service Integrations
- **AI Services**: Google Gemini AI (gemini-2.5-flash, gemini-2.5-pro) integration for financial insights and chat assistance
- **Font Loading**: Google Fonts integration for typography (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Development Tools**: Replit-specific development banner and error overlay plugins

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, React Router (Wouter), React Hook Form
- **Backend**: Express.js with TypeScript support via tsx
- **Build Tools**: Vite with React plugin, esbuild for production builds

### Database and ORM
- **Drizzle ORM**: Type-safe SQL query builder with PostgreSQL dialect
- **Neon Database**: Serverless PostgreSQL database driver (@neondatabase/serverless)
- **Session Store**: connect-pg-simple for PostgreSQL session storage

### UI and Styling
- **Component Library**: Comprehensive shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React icons throughout the application
- **Charts**: Recharts library for data visualization
- **Utilities**: class-variance-authority and clsx for conditional styling

### Data Management
- **State Management**: TanStack React Query for server state and caching
- **Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Utilities**: nanoid for unique ID generation

### Development and Build
- **Development**: tsx for TypeScript execution, Replit development plugins
- **Build**: Vite for frontend bundling, esbuild for backend bundling
- **Code Quality**: TypeScript for static type checking

### AI and External APIs
- **Google Gemini AI**: Advanced AI integration using gemini-2.5-flash for conversational chat and gemini-2.5-pro for detailed spending insights and analysis
- **Environment**: dotenv for environment variable management
