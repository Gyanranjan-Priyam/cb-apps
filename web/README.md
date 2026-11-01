# Tech Stack Documentation

## Overview
Codebreaker Dashboard is a comprehensive full-stack web application built with modern technologies for managing coding events, user profiles, quizzes, and administrative features.

---

## Core Framework & Runtime

### Frontend Framework
- **Next.js** (v16.0.7) - React-based full-stack framework
  - App Router architecture
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes
  - Middleware support

### JavaScript Runtime
- **React** (v19.2.1) - UI library
- **React DOM** (v19.2.0) - React rendering
- **TypeScript** (v5) - Type-safe JavaScript
- **Node.js** (v20.19.24) - Runtime environment

---

## Database & ORM

### Database
- **PostgreSQL** - Primary relational database

### ORM & Database Tools
- **Prisma** (v6.19.0) - Next-generation ORM
  - Schema management
  - Type-safe database client
  - Migrations
  - Database introspection
- **Prisma Next.js Monorepo Workaround Plugin** (v6.19.0) - Build optimization

### Real-time Backend
- **Convex** (v1.30.0) - Real-time backend platform
  - File management
  - Workspace management
  - Code submissions tracking
  - User progress monitoring

---

## Authentication & Security

### Authentication
- **Better Auth** (v1.3.34) - Modern authentication solution
  - Email OTP verification
  - OAuth providers:
    - GitHub OAuth
    - Google OAuth
    - Discord OAuth
  - Admin plugin support
  - Prisma adapter integration

### Security
- **Arcjet** (v1.0.0-beta.14)
  - Rate limiting
  - Security inspection
  - Bot protection
- Environment variable validation with **@t3-oss/env-nextjs** (v0.13.8)
- **Zod** (v4.1.12) - Schema validation

---

## Styling & UI Components

### CSS Framework
- **Tailwind CSS** (v4) - Utility-first CSS framework
- **PostCSS** (@tailwindcss/postcss v4) - CSS processing
- **Sass** (v1.94.2) - CSS preprocessor

### UI Component Libraries

#### Radix UI Primitives
- **Alert Dialog** (v1.1.15)
- **Accordion** (v1.2.12)
- **Avatar** (v1.1.11)
- **Checkbox** (v1.3.3)
- **Collapsible** (v1.1.12)
- **Dialog** (v1.1.15)
- **Dropdown Menu** (v2.1.16)
- **Label** (v2.1.8)
- **Popover** (v1.1.15)
- **Progress** (v1.1.8)
- **Radio Group** (v1.3.8)
- **Scroll Area** (v1.2.10)
- **Select** (v2.2.6)
- **Separator** (v1.1.8)
- **Slot** (v1.2.4)
- **Switch** (v1.2.6)
- **Tabs** (v1.1.13)
- **Toggle** (v1.1.10)
- **Toggle Group** (v1.1.11)
- **Tooltip** (v1.2.8)
- **Aspect Ratio** (v1.1.8)

#### Additional UI Libraries
- **Shadcn/ui** - Component collection (New York style)
  - Custom registries: Aceternity, MagicUI, React Bits, Animate UI
- **Lucide React** (v0.552.0) - Icon library
- **Tabler Icons** (v3.35.0) - Additional icon set
- **React Icons** (v5.5.0) - Icon collection
- **Vaul** (v1.1.2) - Drawer component
- **Sonner** (v2.0.7) - Toast notifications

### Animation & Effects
- **Framer Motion** (v12.23.24) - Animation library
- **Motion** (v12.23.25) - Additional motion features
- **GSAP** (v3.13.0) - Professional animation platform
- **Lenis** (v1.3.15) - Smooth scrolling
- **Three.js** (v0.167.1) - 3D graphics
- **Postprocessing** (v6.38.0) - Three.js effects
- **Simplex Noise** (v4.0.3) - Noise generation

### Utility Libraries
- **Class Variance Authority** (v0.7.1) - Component variants
- **clsx** (v2.1.1) - Conditional classnames
- **Tailwind Merge** (v3.3.1) - Merge Tailwind classes

---

## Forms & Data Management

### Form Handling
- **React Hook Form** (v7.66.0) - Form state management
- **@hookform/resolvers** (v5.2.2) - Validation resolvers
- **Zod** (v4.1.12) - Schema validation

### Data Tables
- **TanStack React Table** (v8.21.3) - Headless table library
- **Recharts** (v2.15.4) - Charting library

### Drag & Drop
- **@dnd-kit/core** (v6.3.1) - Drag and drop toolkit
- **@dnd-kit/sortable** (v10.0.0) - Sortable lists
- **@dnd-kit/modifiers** (v9.0.0) - DnD modifiers
- **@dnd-kit/utilities** (v3.2.2) - DnD utilities

---

## Code Editor

### Editor Components
- **Monaco Editor** (v0.55.1) - VS Code's editor
- **@monaco-editor/react** (v4.7.0) - React wrapper
- **Emmet Monaco ES** (v5.6.1) - Emmet support

---

## Rich Text Editing

### TipTap Editor
- **@tiptap/core** (v3.10.2) - Core editor
- **@tiptap/react** (v3.10.2) - React integration
- **@tiptap/starter-kit** (v3.10.2) - Essential extensions
- **@tiptap/html** (v3.10.2) - HTML rendering
- **@tiptap/pm** (v3.10.2) - ProseMirror integration

#### TipTap Extensions
- **Bullet List** (v3.10.7)
- **Ordered List** (v3.10.7)
- **List Item** (v3.10.7)
- **Image** (v3.10.2)
- **Placeholder** (v3.10.2)
- **Text Align** (v3.10.2)
- **Text Style** (v3.10.2)

---

## File Handling & Storage

### Cloud Storage
- **AWS S3** - Object storage
  - **@aws-sdk/client-s3** (v3.925.0) - S3 client
  - **@aws-sdk/s3-request-presigner** (v3.925.0) - Presigned URLs

### File Upload & Processing
- **React Dropzone** (v14.3.8) - File upload component
- **XLSX** (v0.18.5) - Excel file processing
- **uuid** (v13.0.0) - Unique ID generation
- **slugify** (v1.6.6) - URL-friendly strings

---

## PDF & Document Generation

### PDF Libraries
- **jsPDF** (v3.0.3) - PDF generation
- **pdf-lib** (v1.17.1) - PDF manipulation
- Custom generators:
  - Invoice generator
  - Quiz PDF generator
  - Registration PDF generator

---

## QR Code & Scanning

### QR Code Tools
- **qrcode** (v1.5.4) - QR code generation
- **html5-qrcode** (v2.3.8) - QR code scanning
- QR attendance system integration

---

## Email & Communications

### Email Service
- **Nodemailer** (v7.0.10) - Email sending
  - Gmail SMTP integration
  - Custom email templates
  - HTML email rendering from TipTap JSON

---

## Date & Time

### Date Management
- **date-fns** (v4.1.0) - Date utility library
- **React Day Picker** (v9.11.1) - Date picker component

---

## Layout & UI Utilities

### Layout Components
- **React Resizable Panels** (v3.0.6) - Resizable panels
- **Next Themes** (v0.4.6) - Theme management (dark/light mode)
- **input-otp** (v1.4.2) - OTP input component

---

## Parsing & Rendering

### HTML Parsing
- **html-react-parser** (v5.2.8) - HTML to React
- **html2canvas** (v1.4.1) - Screenshot generation

---

## Code Execution

### Runtime Support
- Custom code execution engine
- Support for multiple programming languages

---

## Analytics & Monitoring

### Analytics
- **@vercel/analytics** (v1.6.1) - Vercel analytics integration

---

## Development Tools

### Linting & Code Quality
- **ESLint** (v9) - JavaScript linting
- **eslint-config-next** (v16.0.1) - Next.js ESLint config

### Build Tools
- **TypeScript** (v5) - Type checking
- **ts-node** (v10.9.2) - TypeScript execution
- **dotenv** (v17.2.3) - Environment variables

### Animation Tools
- **tw-animate-css** (v1.4.0) - Tailwind animation utilities

### Browser Support
- **baseline-browser-mapping** (v2.9.0) - Browser compatibility

---

## Deployment & Hosting

### Platform
- **Vercel** - Primary hosting platform
  - Serverless functions
  - Edge functions
  - Image optimization
  - Analytics

### Configuration Files
- `vercel.json` - Vercel configuration
- `next.config.ts` - Next.js configuration
- `middleware.ts` - Edge middleware

---

## Project Structure

### Application Routes (App Router)
- **(auth)** - Authentication routes
  - Login
  - Onboarding
  - Email verification
- **(homepage)** - Public pages
  - Blog
  - Events
  - Gallery
  - Leaderboard
  - Projects
  - Team
  - Contact
  - Announcements
- **(public)** - Public features
  - Dashboard
  - Quiz system
  - Privacy & Terms
- **admin** - Admin panel
  - Announcement management
  - Attendance tracking
  - Profile management
- **api** - API routes

### Key Directories
- `/components` - React components
- `/lib` - Utility functions and configurations
- `/hooks` - Custom React hooks
- `/prisma` - Database schema and migrations
- `/convex` - Convex backend functions
- `/scripts` - Utility scripts
- `/public` - Static assets

---

## Environment Variables

### Required Services
- Database (PostgreSQL)
- AWS S3 (file storage)
- Convex (real-time backend)
- OAuth providers (GitHub, Google, Discord)
- Email (Gmail SMTP)
- Arcjet (security)

---

## API & Integration

### External API Client
- Custom external API client
- External API types and documentation
- Platform integration guides

---

## Key Features

### User Management
- User authentication (OAuth + Email OTP)
- Profile management
- Registration system with PDF generation
- QR-based attendance tracking

### Content Management
- Blog system
- Event management
- Gallery
- Announcements
- Team management

### Code Platform
- Monaco-based code editor
- Code execution engine
- Quiz system
- Leaderboard
- User progress tracking
- File workspace management

### Admin Features
- Dashboard analytics
- User management
- Attendance tracking
- Announcement creation
- Profile verification
- Export utilities (Excel, PDF)

### Team Collaboration
- Team formation utilities
- Project management
- Event participation

---

## Documentation

### Available Documentation
- External API documentation
- Product Requirements Document (PRD)
- QR Attendance documentation and setup
- Platform integration guide
- Component registry integration

---

## Version Control

### Git Integration
- GitHub repository
- Version controlled schema migrations
- Automated build processes

---

## Performance Optimizations

### Image Optimization
- Next.js Image component
- WebP and AVIF format support
- Multiple device sizes support
- Remote pattern allowlisting
- CDN integration (Cloudinary, AWS S3)

### Code Splitting
- Next.js automatic code splitting
- Dynamic imports
- Route-based splitting

---

## Testing & Quality Assurance

### Type Safety
- TypeScript throughout the codebase
- Zod schema validation
- Prisma type generation
- Better Auth type safety

---

## Additional Utilities

### String & Data Processing
- Slugify for URL generation
- UUID for unique identifiers
- Excel data import/export

### System Settings
- Custom system settings management
- Team utilities
- Image utilities
- Export utilities

---

## Custom Implementations

### Email Templates
- Verification emails
- Notification emails
- Promotional messages

### PDF Generators
- Invoice generation
- Quiz papers
- Registration certificates

### Middleware
- Registration middleware
- Authentication middleware
- Route protection

---

## Component Libraries Integration

### Shadcn/ui Registries
1. **@aceternity** - Aceternity UI components
2. **@magicui** - Magic UI components
3. **@react-bits** - React Bits components
4. **@animate-ui** - Animate UI components

All accessible through the custom components registry system.

---

## Summary

This project leverages a modern, comprehensive tech stack combining:
- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Convex for real-time features, Prisma with PostgreSQL for data persistence
- **Authentication**: Better Auth with multiple OAuth providers
- **File Storage**: AWS S3
- **Security**: Arcjet protection
- **Rich Features**: Code execution, PDF generation, QR attendance, email notifications
- **UI/UX**: Extensive component library with animations and modern design patterns

The stack is designed for scalability, type safety, developer experience, and modern web application best practices.
