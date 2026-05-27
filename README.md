# Bongshobrikkho 🌳

A modern, scalable Family Tree and social platform built for families to preserve their heritage and stay connected.

## 🚀 Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth:** [Supabase (PostgreSQL)](https://supabase.com/)
- **State Management:** [TanStack Query](https://tanstack.com/query/latest) & [Zustand](https://docs.pmnd.rs/zustand/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+ 
- A Supabase project

### 2. Environment Setup
Create a `.env.local` file in the root and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the SQL found in `supabase-schema.sql` in your Supabase SQL Editor to initialize the tables and Row Level Security (RLS) policies.

### 4. Installation
```bash
pnpm install
```

### 5. Development
```bash
pnpm dev
```

## 📂 Project Structure

- `src/app/`: Next.js App Router (Pages and Layouts)
- `src/components/`: Reusable UI components
- `src/hooks/`: Custom React hooks for data and logic
- `src/lib/`: Library configurations (Supabase, utils)
- `src/types/`: TypeScript interfaces and Zod schemas
- `src/utils/`: Helper functions
