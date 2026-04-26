# 🏥 TRMS Frontend

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

The **Tigray Resilient Referral System (TRMS) Frontend** is a modern, enterprise-grade clinical dashboard designed to manage the end-to-end medical referral lifecycle across distributed healthcare facilities.

Built with **React 19** and **Vite**, the application provides a high-performance, real-time interface for healthcare professionals to track patients, manage triage, and coordinate inter-facility transitions.

## ✨ Key Features

- **Role-Based Experience (RBAC):** Tailored views and permission sets for System Admins, Facility Admins, Doctors, Liasons, and HEWs. Elements are dynamically rendered based on the authenticated actor's domain.
- **Real-Time Referral Lifecycle:** Seamlessly manage the state machine of a referral—from initial intake and routing to acceptance, forwarding, and final discharge.
- **Advanced Triage Engine:** Integrated prioritization system (Emergency, Urgent, Routine) with automated wait-time estimation and department-specific routing.
- **Offline-First Synchronization:** Robust background sync logic to handle intermittent connectivity, ensuring clinical data is queued and pushed when the network stabilizes.
- **Rich Analytics Dashboard:** Comprehensive data visualization using Chart.js to track referral volumes, facility performance metrics, and department throughput.
- **Premium UI/UX:** Responsive design with fluid dark mode support, modern typography, and micro-interactions optimized for clinical efficiency.

## 🏗️ Architecture

The frontend is organized into logical feature modules to ensure scalability and maintainability:

- `src/features`: Domain-specific modules (e.g., `referrals`, `triage`, `analytics`) containing their own components and logic.
- `src/context`: Global state management for authentication, language localization, and referral data orchestration.
- `src/lib`: Core infrastructure bindings, including the `trmsApi` client and shared utility functions.
- `src/components`: Atomic UI components and reusable layout patterns following the design system.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn

### Installation

```bash
# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Running the System

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## 🛠️ Scripts

- `npm run dev`: Launches the Vite development server with HMR.
- `npm run build`: Executes TypeScript compilation and Vite production bundling.
- `npm run lint`: Runs ESLint for code quality and style consistency.

## 🛡️ Security

- **JWT Session Management**: Tokens are securely managed and rotated via sessionStorage.
- **Route Guarding**: Protected routes prevent unauthorized access to administrative and clinical views.
- **Input Sanitization**: Strict validation on all patient and clinical data entry points.

---
Built with 🏥 for the Tigray Healthcare Ecosystem.
