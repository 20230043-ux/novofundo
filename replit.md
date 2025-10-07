# Plataforma de Sustentabilidade - Fundo Verde

## Overview

The Fundo Verde platform is a comprehensive sustainability management system designed for companies to calculate their carbon footprint, invest in Sustainable Development Goals (SDGs), and track their environmental impact. The application serves as a bridge between carbon emissions calculation and sustainable investment opportunities in Angola. Its purpose is to facilitate environmental responsibility and investment in sustainable projects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with **dual deployment options**:

### Deployment Options

#### 1. Replit (Original - Express.js)
Traditional Express server with sessions, WebSockets, and local file uploads (in `/server` folder).

#### 2. Vercel Serverless (New - Production Ready)
Fully migrated to serverless architecture with JWT, Cloudinary uploads, and Pusher real-time (in `/api` folder).

### High-Level Architecture (Vercel Serverless)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React SPA     │◄──►│ Vercel Functions│◄──►│  Neon PostgreSQL│
│   (Frontend)    │    │   (Serverless)  │    │   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────┐                          ┌─────────────────┐
│   Cloudinary    │                          │     Pusher      │
│  (File Upload)  │                          │  (Real-time)    │
└─────────────────┘                          └─────────────────┘
```

### Technology Stack

#### Frontend
-   **Framework**: React 18 with TypeScript
-   **Styling**: TailwindCSS + shadcn/ui components
-   **Bundler**: Vite
-   **Routing**: Wouter
-   **State**: React Query (TanStack Query v5)

#### Backend (Vercel Serverless)
-   **API**: Vercel Serverless Functions (Node.js)
-   **Authentication**: JWT tokens in httpOnly cookies
-   **File Upload**: Cloudinary (free tier: 25GB)
-   **Real-time**: Pusher Channels (free tier: 100 connections, 200k msgs/day)

#### Backend (Replit Express - Legacy)
-   **Server**: Express.js with TypeScript
-   **Authentication**: Express sessions with bcrypt
-   **File Upload**: Local filesystem (Multer)
-   **Real-time**: Custom WebSocket server

#### Database
-   **PostgreSQL**: Neon Database (serverless, @neondatabase/serverless driver)
-   **ORM**: Drizzle ORM with Zod validation

### Key Features and Implementations

#### Core Features
-   **Carbon Footprint Calculation**: Companies input consumption data, system calculates CO2 emissions
-   **SDG Investment Platform**: Browse and invest in sustainable development projects
-   **Payment Proof System**: Upload and manage investment payment proofs with approval workflow
-   **Admin Dashboard**: Comprehensive stats, project management, and payment approval system
-   **Multi-role Support**: Separate interfaces for companies, individuals, and administrators

#### Technical Implementations

**Vercel Serverless (Production)**
-   **Authentication**: JWT-based auth with httpOnly cookies, refresh token rotation
-   **File Uploads**: Cloudinary integration with signed uploads, 10MB limit per file
-   **Real-time**: Pusher Channels for project updates, payment status notifications
-   **API Routes**: 70+ serverless functions in `/api` folder (auth, company, admin, public, upload)
-   **Security**: Role-based middleware (withAuth, withCompany, withAdmin), CORS configured
-   **Hooks**: `use-cloudinary-upload.ts` for uploads, `use-pusher.ts` for real-time subscriptions

**Replit Express (Legacy)**
-   **Authentication**: Session-based with PostgreSQL store, bcrypt password hashing
-   **File Uploads**: Local filesystem with Multer, files stored in `/uploads`
-   **Real-time**: Custom WebSocket server with authenticated connections
-   **API**: Express routes in `/server/routes.ts`
-   **Persistence**: Connection pooling, transaction management, automatic backups

**Frontend Architecture**
-   **State Management**: React Query for server state, Context API for auth state
-   **Forms**: React Hook Form with Zod validation schemas from `@shared/schema.ts`
-   **Real-time**: Event-driven with `investmentEvents` system + Pusher/WebSocket hooks
-   **Optimistic UI**: Instant updates with cache invalidation on mutations

## External Dependencies

### Core Dependencies
-   **@neondatabase/serverless**: Neon Database HTTP driver for PostgreSQL (serverless compatible)
-   **drizzle-orm**: Type-safe ORM for database operations with Zod integration
-   **@tanstack/react-query**: Server state management (TanStack Query v5)
-   **@radix-ui/***: Headless UI component library (shadcn/ui)
-   **bcryptjs**: Password hashing for security

### Vercel Serverless Stack
-   **@vercel/node**: Vercel serverless function types (VercelRequest, VercelResponse)
-   **jsonwebtoken**: JWT generation and verification for authentication
-   **cloudinary**: File upload service (images, logos, payment proofs)
-   **pusher**: Real-time communication service
-   **pusher-js**: Pusher client library for React

### Replit Express Stack (Legacy)
-   **express**: HTTP server framework
-   **express-session**: Session management
-   **connect-pg-simple**: PostgreSQL session store
-   **multer**: File upload handling (local filesystem)
-   **ws**: WebSocket server for real-time features
-   **archiver**: ZIP compression for backups

## Recent Changes (December 2024)

### Vercel Serverless Migration (COMPLETED)
-   ✅ Created `/api` folder with 70+ serverless functions
-   ✅ Migrated authentication from sessions to JWT (httpOnly cookies)
-   ✅ Migrated file uploads from local filesystem to Cloudinary
-   ✅ Migrated WebSockets to Pusher Channels
-   ✅ Updated frontend AuthContext for JWT authentication
-   ✅ Created deployment documentation (`VERCEL_DEPLOY.md`, `DEPLOYMENT_READY.md`)
-   ✅ All critical endpoints tested and validated

### Files Added
-   `/api/*` - All Vercel serverless functions
-   `api/lib/jwt.ts` - JWT utilities
-   `api/lib/auth-middleware.ts` - Auth middleware for serverless
-   `api/lib/cloudinary.ts` - Cloudinary upload utilities
-   `api/lib/pusher.ts` - Pusher server utilities
-   `client/src/hooks/use-cloudinary-upload.ts` - Cloudinary upload hook
-   `client/src/hooks/use-pusher.ts` - Pusher real-time hooks
-   `vercel.json` - Vercel configuration
-   `.env.example` - Environment variables template
-   `VERCEL_DEPLOY.md` - Comprehensive deployment guide
-   `DEPLOYMENT_READY.md` - Quick start deployment instructions