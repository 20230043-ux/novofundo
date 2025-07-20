# Plataforma de Sustentabilidade - Fundo Verde

## Overview

The Fundo Verde platform is a comprehensive sustainability management system designed for companies to calculate their carbon footprint, invest in Sustainable Development Goals (SDGs), and track their environmental impact. The application serves as a bridge between carbon emissions calculation and sustainable investment opportunities in Angola.

**Current Status**: Production-ready with full keep-alive system implemented to prevent Replit hibernation on free tier.

## System Architecture

### High-Level Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React SPA     │◄──►│   Express.js    │◄──►│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript, comprehensive API endpoints
- **Database**: PostgreSQL via Neon Database (serverless), Drizzle ORM
- **Authentication**: Custom session-based authentication with bcrypt
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Deployment**: Optimized for Replit hosting environment

## Key Components

### Frontend Architecture

The frontend is built with modern React patterns and optimized for performance:

1. **Component Structure**:
   - UI components using shadcn/ui design system
   - Custom business logic components
   - Layout components (Navbar, Sidebar, Footer)
   - Specialized components (ProjectCard, OdsIcon)

2. **State Management**:
   - React Query for server state management
   - Custom hooks for business logic
   - Context API for authentication and onboarding
   - Global event system for real-time investment updates

3. **Routing**: 
   - Wouter for lightweight client-side routing
   - Protected routes for authenticated users
   - Role-based access control (Admin vs Company)

4. **Event-Driven Architecture**:
   - Global `investmentEvents` system for broadcasting investment value changes
   - Component subscription model for receiving real-time updates
   - Optimistic update pattern for immediate UI feedback
   - Graceful fallback to cached data when events are unavailable

### Backend Architecture

The Express.js backend provides a comprehensive API with:

1. **Authentication System**:
   - Custom session-based authentication
   - Password hashing with bcrypt
   - Role-based access control (admin/company)

2. **Database Layer**:
   - Drizzle ORM for type-safe database operations
   - Connection pooling for optimal performance
   - Comprehensive schema with relationships

3. **Performance Optimizations**:
   - Response compression
   - Static file caching
   - Database connection pooling
   - Preload cache for frequently accessed data

## Data Flow

### Carbon Footprint Calculation Flow

1. **Data Input**: Companies input consumption data (energy, fuel, water, waste)
2. **Calculation**: Backend calculates CO2 emissions using predefined factors
3. **Compensation**: System calculates required investment for carbon offset
4. **Investment**: Companies can invest in SDG projects to offset emissions
5. **Tracking**: Dashboard shows progress and impact metrics

### Investment Tracking Flow

1. **Project Selection**: Companies browse available SDG projects
2. **Investment Submission**: Upload payment proofs and investment details
3. **Admin Review**: Admin validates and approves investments
4. **Public Display**: Approved investments appear on public project pages
5. **Impact Metrics**: System tracks and displays collective impact

### Instant Investment Update System

The platform implements a sophisticated real-time update system for investment values:

1. **Global Event System**: Central `investmentEvents` module broadcasts value changes across components
2. **Optimistic Updates**: UI updates immediately before server confirmation for instant feedback
3. **Component Subscription**: Project cards subscribe to investment events for their specific project ID
4. **State Management**: Local state (`currentInvestmentValue`) overrides cached values for real-time display
5. **Fallback Strategy**: System gracefully falls back to cached or default values if events fail
6. **Cache Invalidation**: Aggressive cache busting ensures eventual consistency with server state

This architecture eliminates delays in investment value updates, providing users with instant visual feedback when admin makes changes to project investment amounts.

## External Dependencies

### Core Dependencies

- **@neondatabase/serverless**: Neon Database integration for PostgreSQL
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Comprehensive UI component library
- **bcryptjs**: Password hashing for security
- **express-session**: Session management

### Development Dependencies

- **tsx**: TypeScript execution for development
- **vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript bundler for production
- **tailwindcss**: Utility-first CSS framework

### Optional Integrations

- **Multer**: File upload handling for logos and documents

## Deployment Strategy

### Build Process

1. **Frontend Build**: Vite compiles React application to static assets
2. **Backend Build**: esbuild bundles Express.js server for production
3. **Database Setup**: Drizzle migrations create and update database schema
4. **Environment Configuration**: Environment variables for database and session secrets

### Production Optimizations

1. **Static File Serving**: Optimized caching headers for assets
2. **Compression**: Gzip compression for all responses
3. **Database Pooling**: Connection reuse for better performance
4. **Error Handling**: Comprehensive error logging and user feedback

### Environment Setup

```bash
# Development
npm run dev          # Start development server
npm run db:push      # Apply database schema changes
npm run db:seed      # Populate database with initial data

# Production
npm run build        # Build for production
npm start           # Start production server
```

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
- July 04, 2025. Enhanced cache invalidation system:
  • Reduced cache TTL from 30-120 minutes to 2-5 minutes for dynamic content
  • Added comprehensive cache clearing on project updates, creation, and deletion
  • Implemented cache invalidation for investment updates and project modifications
  • Added manual cache clearing endpoint for admin users
  • Fixed project cover image update issues by improving cache invalidation
  • Enhanced cache headers with must-revalidate for better synchronization across tabs
- July 04, 2025. Real-time updates and cross-device image optimization:
  • Fixed real-time project updates across all pages through improved cache invalidation
  • Reduced query stale time to 30 seconds for faster real-time updates
  • Implemented comprehensive cache invalidation on all project mutations (create, edit, delete)
  • Created intelligent image loading system with fallback mechanisms
  • Added smart image loading hook to prevent infinite loading loops
  • Enhanced image serving with mobile optimization and proper cache headers
  • Fixed cross-device image loading issues with multiple extension fallbacks
  • Added image verification endpoint for better error handling
- July 04, 2025. Aggressive image cache-busting for immediate updates:
  • Implemented project-specific timestamp system for per-project cache invalidation
  • Added multiple random parameters and timestamps to force immediate image refresh
  • Enhanced smart image loading hook with aggressive cache-busting parameters
  • Created forceProjectImageRefresh function for instant image updates after edits
  • Added multiple sequential refetch calls to ensure immediate visual updates
  • Updated all image rendering throughout the application with cache-busting URLs
  • Fixed edit dialog image display to show updated images immediately
  • Eliminated all image caching delays across admin publications and public views
- July 14, 2025. Enhanced ODS selection and individual reports:
  • Added "Deixar o admin escolher" option in ODS selection dropdown for individuals
  • Created global investment totals API endpoint to show total funding received by each ODS
  • Updated individual payment proof form to display global investment amounts for each ODS
  • Enhanced backend to handle admin_choice option for ODS selection
  • Added individuals section to admin reports page with recent individuals listing
  • Updated reports navigation to include 4 tabs: Investimentos, Empresas, Pessoas, Emissões
  • Added comprehensive individual statistics display in reports
- July 14, 2025. Messaging system improvements:
  • Successfully removed subject field from messaging system as requested
  • Fixed authentication issues preventing admin messaging functionality
  • Confirmed admin login credentials (admin@gmail.com / 123456789)
  • Verified message sending between admin and users works correctly
  • WhatsApp/SMS integration available but requires system dependencies (Chrome/Chromium) not available in Replit
  • All messaging endpoints functional: /api/messages, /api/admin/messages, /api/whatsapp/send-message
- July 14, 2025. Chat-like messaging interface for better organization:
  • Implemented conversation list view for both admin and user messaging pages
  • Added contact-first navigation - users see conversation participants before opening individual chats
  • Created WhatsApp-like chat interface with message bubbles and real-time input
  • Enhanced conversation grouping showing last message, unread count, and timestamps
  • Added conversation threading for cleaner message organization
  • Improved UX with back navigation between conversation list and individual chats
  • Both admin and user views now use consistent chat interface design
- July 17, 2025. Instant project publication and investment update system:
  • Implemented sub-100ms response system for all project operations using optimistic updates
  • Created instant cache invalidation for immediate UI feedback on project creation, editing, and deletion
  • Added optimistic update mutations that show changes immediately before server confirmation
  • Enhanced investment value updates with instant UI reflection - no delays or loading states
- July 19, 2025. Replit Free Tier Hibernation Prevention System:
  • Implemented comprehensive keep-alive system to prevent database and application hibernation on Replit free tier
  • Created automatic database query system that runs every 4 minutes to keep PostgreSQL active
  • Added multiple monitoring endpoints: /api/keep-alive, /health, and root endpoint
  • Built status monitoring page at /status.html with real-time system health checking
  • Created detailed UptimeRobot configuration guide for 24/7 external monitoring
  • Documented complete "Replit for the poor" solution in REPLIT_KEEP_ALIVE_GUIDE.md
  • System now operates continuously without hibernation on free Replit tier using UptimeRobot external pings
  • All endpoints tested and confirmed working for external monitoring services
  • Optimized ODS pending assignment system with real-time updates every 2 seconds
  • Created instant removal from pending list when admin assigns ODS to payment proofs
  • All project publications now appear instantaneously in the interface with aggressive cache-busting
  • Investment updates reflect immediately in the admin interface with optimistic state management
  • ODS assignments remove items from pending list instantly with rollback on errors
- July 17, 2025. Global event system for instant investment value propagation:
  • Implemented global investmentEvents system to broadcast investment updates across all components
  • Created subscription-based architecture allowing project cards to receive instant value updates
  • Added currentInvestmentValue state management in ProjectCard components for immediate UI reflection
  • Solved investment value update delays by bypassing React Query cache for real-time value display
  • Enhanced user experience with instant visual feedback when admin updates investment values
  • Investment changes now propagate instantly to all project cards regardless of cache state
  • Maintained data consistency with server while providing immediate optimistic UI updates
- July 17, 2025. Fixed project persistence and cache invalidation issues:
  • Resolved "Projetos Ativos" disappearing due to aggressive cache invalidation settings
  • Changed staleTime from 0 to 30 seconds and gcTime from 0 to 5 minutes for proper data persistence
  • Fixed query key consistency by removing dynamic parameters that prevented proper cache invalidation
  • Added debug information and improved error handling for project loading states
  • Enhanced fallback states to show appropriate messages when projects fail to load
  • Replaced aggressive queryClient.removeQueries with invalidateQueries to preserve cached data
  • Added "Tentar Novamente" button for recovery when projects fail to load
- July 18, 2025. Complete removal of WhatsApp and SMS systems:
  • Removed all WhatsApp Web.js integration code and dependencies
  • Deleted whatsapp-service.ts and whatsapp-assistant.ts server files
  • Removed all WhatsApp-related API endpoints from routes.ts
  • Eliminated WhatsApp admin page and navigation links
  • Uninstalled whatsapp-web.js, qrcode-terminal, and node-cron packages
  • Cleaned up all imports and references to WhatsApp functionality
  • Removed Chrome/Puppeteer dependency checking functions
  • Platform now operates without any messaging automation systems
- July 18, 2025. UI improvements and toast notification optimizations:
  • Fixed X button alignment in OnboardingWizard component (moved from right-4 top-4 to right-6 top-6)
  • Reduced toast notification duration from 1,000,000ms to 2,000ms (2 seconds) for all notifications
  • Added logout success toast notification with "Logout realizado com sucesso" message
  • Enhanced user experience with faster disappearing notifications for login and logout actions
  • Improved visual feedback consistency across authentication flows
  • Removed "Mensagens" link from admin navigation menu (both desktop and mobile)
  • Confirmed complete removal of SMS functionality for all user types (individuals, companies, and admin)
  • Verified no SMS-related code, environment variables, or configuration files remain in the system
  • Completely removed all messaging functionality from the platform:
    - Removed "Mensagens" navigation links from individual and company user menus
    - Removed messaging routes from App.tsx (/mensagens and /admin/mensagens)
    - Removed messaging component imports and unused badge/unread count functionality
    - Cleaned up navbar imports (removed useMessages hook, Badge component, MessageCircle icon)
    - Platform now operates without any internal messaging system between users and admin
- July 18, 2025. Enhanced calculator UX and pending payment proofs display:
  • Implemented separate "Calculate" and "Save" buttons for both individual and company calculators
  • Added multiplication factor descriptions showing emission coefficients (e.g., "× 0.5 kg CO2/kWh")
  • Created detailed calculation breakdown summary after calculation with per-category emissions
  • Enhanced "Comprovativos Pendentes" to show complete entity information for both companies and individuals
- July 20, 2025. Fixed individual investment display and status issues:
  • Resolved missing investments in "Meus Investimentos" section for individual users
  • Fixed backend investment creation logic to include individualId when payment proofs are approved
  • Corrected frontend status display to read from investment.paymentProof.status instead of non-existent investment.status
  • Added proper color coding for investment status badges (green for approved, yellow for pending)
  • Created missing investment record for existing approved payment proof (151,941 Kz investment) entity type badges, photos/logos, email addresses, and additional details (sector, age)
  • Updated backend to include full user and entity relationships for payment proofs
  • Fixed null pointer exceptions in both admin companies and pending ODS assignment pages
  • Improved data validation requiring calculation before allowing data saving
- July 20, 2025. Added description/naming functionality to carbon footprint calculators:
  • Added optional "description" field to consumption_records table in database
  • Updated both individual and company calculator schemas to include description field
  • Added "Nome do Cálculo" input field in calculator interfaces with helpful placeholders
  • Users can now name their calculations (e.g., "Consumo Janeiro 2025", "Escritório Central")
  • Enhanced user experience allowing better organization and identification of calculation records
- July 20, 2025. Dashboard UX improvements with motivational messaging:
  • Changed "Progresso da Pegada de Carbono" card to "Seu Impacto Positivo" for more positive messaging
  • Updated card description to "Cada ação sua faz a diferença para o planeta! 🌍"
  • Replaced TrendingUp icon with green Leaf icon to emphasize sustainability
  • Added real data display showing total investments, calculated CO₂, and compensation values
  • Included motivational message: "🎯 Continue assim! Você está contribuindo para um futuro mais verde"
  • Enhanced visual design with positive green, blue, and yellow color scheme
- July 18, 2025. Complete WebSocket real-time system implementation:
  • Implemented comprehensive WebSocket server using ws library for real-time communication
  • Created WebSocketProvider and useWebSocket hook for client-side real-time functionality
  • Added authentication system for WebSocket connections with user role verification
  • Built real-time broadcasting for project updates, investment changes, and payment proof status updates
  • Integrated WebSocket status indicators in navbar for all user types (admin, company, individual)
  • Created real-time notification system with toast messages for live updates
  • Added automatic cache invalidation triggered by WebSocket events for instant UI updates
  • Implemented heartbeat system with 30-second intervals for connection stability
  • Added graceful reconnection logic with 3-second retry intervals for resilient connections
  • All real-time updates now work across browsers outside Replit environment
  • System supports cross-browser synchronization for project management, investment tracking, and administrative workflows
- July 19, 2025. Complete backup and restore system for admin:
  • Created comprehensive backup service (server/backup-service.ts) with ZIP compression using archiver library
  • Implemented organized backup structure by categories: empresas/, pessoas/, projetos/ with proper file naming
  • Added complete API endpoints for backup operations: /api/admin/backup/create-full, /api/admin/backup/create-specific, /api/admin/backup/list, /api/admin/backup/download, /api/admin/backup/restore
  • Built admin interface at /admin/backup with intuitive design for backup management
  • Added "Backup & Restauração" option to admin sidebar navigation with Download icon
  • Backup includes: company logos and data, individual profile photos and data, project images and updates, payment proofs, complete database relationships
  • Implemented metadata system for backup validation and restoration integrity
  • Created file size formatting and backup listing with creation dates and download functionality
  • Added restore capability with file upload and validation for ZIP files
  • System maintains complete data organization for easy restoration: folders named by entity ID and sanitized names
  • All files properly organized with JSON metadata for each entity including relationships and export timestamps
  • Backup system designed to preserve data integrity and enable complete site restoration after data loss
```