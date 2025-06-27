# Mathematics Study Platform

## Overview

This is a comprehensive mathematics study platform built as a full-stack web application. It provides an ultra-minimalist interface for studying mathematics with dynamic exercises, a Pomodoro timer, automatic response saving, and AI-powered assistance through the GROQ API. The platform supports LaTeX/KaTeX rendering for mathematical notation and features a dark theme optimized for focused study sessions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand with persistence middleware for global state
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent design
- **Build Tool**: Vite for fast development and optimized production builds
- **Math Rendering**: KaTeX and MathJax for LaTeX mathematical notation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with Express routes
- **Development Mode**: Vite middleware integration for hot module replacement

## Key Components

### Data Management
- **Exercise System**: Structured exercises organized by sections and topics
- **Response Tracking**: Auto-saving user responses with timestamps
- **Settings Management**: Configurable Pomodoro timer, time limits, and API keys
- **Session Tracking**: Study session monitoring with statistics

### Exercise Parser
- **File Processing**: Automated loading of exercises from JavaScript files
- **Section Detection**: Intelligent parsing of exercise sections and ordering
- **Data Normalization**: Consistent exercise structure across different sources

### AI Integration
- **GROQ API**: Integration with Llama 3.1 8B model for mathematics assistance
- **Educational Context**: Specialized system prompts for adaptive mathematics education
- **LaTeX Support**: AI responses formatted with proper mathematical notation

### User Interface
- **Minimalist Design**: Ultra-clean interface optimized for focus
- **Dark Theme**: Eye-strain reducing dark color scheme
- **Responsive Layout**: Mobile-friendly design with adaptive components
- **Mathematical Rendering**: Real-time LaTeX/KaTeX processing

## Data Flow

1. **Exercise Loading**: JavaScript exercise files are parsed and stored in PostgreSQL
2. **User Interaction**: Students navigate through exercises with keyboard shortcuts
3. **Response Handling**: User inputs are auto-saved with debouncing to prevent data loss
4. **AI Assistance**: GROQ API provides contextual help when requested
5. **Timer Management**: Pomodoro timer tracks study sessions and breaks
6. **Settings Persistence**: User preferences are saved and synchronized

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **zustand**: Minimal state management with persistence

### UI Dependencies
- **@radix-ui/***: Comprehensive unstyled UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for UI elements
- **class-variance-authority**: Type-safe CSS class variants

### Development Dependencies
- **typescript**: Static type checking
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Local Database**: PostgreSQL 16 module in Replit
- **Hot Reload**: Vite development server with Express middleware
- **Port Configuration**: Development server on port 5000

### Production Deployment
- **Build Process**: Vite builds the frontend, esbuild bundles the backend
- **Database**: Neon serverless PostgreSQL for production
- **Environment Variables**: DATABASE_URL and GROQ_API_KEY configuration
- **Static Serving**: Express serves built frontend assets

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Auto-deployment**: Configured for autoscale deployment target
- **Workflows**: Automated development and production workflows

## Changelog

- June 23, 2025. Initial setup
- June 23, 2025. Built ultra-minimalist mathematics study interface with dark theme, large writing area, discrete indicators, and side navigation buttons
- June 23, 2025. Implemented dynamic exercise loading system that reads from JavaScript files with "seccion", "tema", "enunciado", and "id" structure
- June 23, 2025. Added cross-env compatibility for Windows development
- June 23, 2025. **Major Feature Updates:**
  - Added section completion feedback with GROQ API integration
  - Fixed Pomodoro timer countdown functionality to start when typing begins
  - Implemented optimized auto-save system (saves only on navigation, not continuously)
  - Added response persistence across navigation with local storage
  - Created logging system (log.txt) for debugging auto-save issues
  - Enhanced navigation to preserve user responses when using Ctrl+arrows
  - Implemented dynamic section loading system with `/sube-seccion/` folder
  - Added section transition countdown (5-4-3-2-1) with feedback option
  - Created rest break notifications when Pomodoro timer completes
  - Implemented BKT (Bayesian Knowledge Tracing) system for automatic domain detection
  - Fixed section separation logic to create truly independent sections
  - Added automatic difficulty classification (básico/intermedio/avanzado)
  - Enhanced domain detection for Álgebra, Cálculo, Geometría, Trigonometría, etc.
  - **FIXED:** Section navigation loop issue that prevented advancing between sections
  - **ADDED:** KaTeX support for mathematical notation rendering in exercises and feedback
  - **ENHANCED:** Settings with custom feedback prompts and multiple Groq model selection
  - **ADDED:** Mathematical formula rendering with LaTeX support ($formula$ and $$formula$$)
  - **INTEGRATED:** Electron desktop app support for standalone .exe generation
  - **ADDED:** Complete desktop app packaging with Windows installer and portable versions
  - **MIGRATED:** Successfully migrated from Replit Agent to Replit environment with full compatibility
  - **ADDED:** Section file management system with upload/delete functionality for .js files in /sube-seccion/
  - **ENHANCED:** Settings modal with file manager icon for managing exercise sections dynamically
  - **IMPLEMENTED:** Real-time exercise reloading when sections are added or removed (no memory persistence)

## Development Setup

### Running on Windows/PC

#### Web Version
The project uses cross-env for Windows compatibility. To run on your PC:

```bash
# Install dependencies
npm install

# Run development server (cross-env compatible)
npm run dev
```

#### Desktop App (Electron)
Convert to standalone .exe application:

```bash
# Development mode with hot reload
test-electron.cmd

# Build production .exe
npm run build
npx electron-builder --win --config electron-builder.json

# Or use the automated script
build-exe.cmd
```

**Build Outputs:**
- `electron-dist/Mathematics Study Platform Setup.exe` - Windows installer
- `electron-dist/win-unpacked/Mathematics Study Platform.exe` - Portable version

The desktop app includes:
- Native window controls and menus
- Keyboard shortcuts (Ctrl+Left/Right for navigation)
- Offline capability (except AI features)
- System integration with proper icons
- No browser dependency

### Exercise Data Structure

#### Static Files (attached_assets/)
The system loads exercises from existing JavaScript files in the attached_assets folder.

#### Dynamic Section Loading (/sube-seccion/)
New feature: Upload sections dynamically to the `/sube-seccion/` folder. Each JavaScript file represents a new section:

```javascript
export const ejercicios = [
  {
    "seccion": "Seccion 4",
    "tema": "Topic name", 
    "enunciado": "Exercise statement",
    "ejercicio": "Exercise content (optional)",
    "id": "Unique identifier"
  }
]
```

**Usage:**
1. Create a `.js` file in `/sube-seccion/` folder
2. Use the format above with `export const ejercicios = [...]`
3. The system automatically detects and loads new sections on restart
4. Section numbers are auto-assigned based on file loading order

## User Preferences

Preferred communication style: Simple, everyday language.
System compatibility: Windows PC using cross-env for npm scripts.