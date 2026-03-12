# 🚀 CHAAX Project Management System

Modern, real-time project management system built with Next.js 14, TypeScript, and Tailwind CSS.

## ✨ Features

- 🎨 **Modern UI** - Clean interface với Navy Blue & Gold color scheme
- 🔐 **Authentication** - JWT-based auth với auto token refresh
- ⚡ **Real-time Updates** - WebSocket integration cho collaborative features
- 📱 **Responsive Design** - Mobile-first approach
- 🎭 **Animations** - Smooth transitions với Framer Motion
- 🧩 **Component Library** - Reusable UI components
- 🔒 **Type Safety** - Full TypeScript support

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Socket.io Client
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```

## 🌐 Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=http://localhost:8080
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js pages & routing
├── components/          # Reusable components
│   ├── ui/             # UI component library
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Header.tsx      # Top header
│   ├── Footer.tsx      # Footer
│   └── MainLayout.tsx  # Main layout wrapper
├── config/             # Configuration files
├── hooks/              # Custom React hooks
├── lib/                # Libraries & utilities
│   ├── api/           # API client
│   ├── stores/        # Zustand stores
│   └── helper/        # Helper functions
├── providers/          # Context providers
└── types/             # TypeScript definitions
```

**📚 Xem chi tiết:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🎨 Design System

### Colors

- **Primary**: `#1e3a5f` (Navy Blue) - Sidebar, Header, Footer
- **Secondary**: `#eab308` (Gold) - Buttons, Accents, Logo

### Components

- ✅ Button (5 variants)
- ✅ Card (với Header, Title, Content)
- ✅ Input (với label, error, helper text)
- ✅ Sidebar (collapsible navigation)
- ✅ Header (với search & user menu)
- ✅ Footer (với links & social)
- ✅ LoadingPage, ErrorPage, NotFoundPage

**📚 Xem usage:** [src/components/USAGE.md](./src/components/USAGE.md)

## 🚦 Getting Started

### 1. Tạo trang mới

```tsx
// app/projects/page.tsx
import { MainLayout } from "@/components";

export default function ProjectsPage() {
    return (
        <MainLayout>
            <h1>Projects</h1>
        </MainLayout>
    );
}
```

### 2. Sử dụng UI Components

```tsx
import { Button, Card, Input } from "@/components";

<Card>
    <Input label="Name" />
    <Button variant="primary">Submit</Button>
</Card>;
```

### 3. API Calls

```tsx
import { apiClient } from "@/lib/api";

const data = await apiClient.get("/projects");
```

### 4. Authentication

```tsx
import { useAuthStore } from "@/lib/stores";

const { user, isAuthenticated, logout } = useAuthStore();
```

## 📖 Documentation

- [📂 Project Structure](./PROJECT_STRUCTURE.md) - Chi tiết folder structure
- [🎨 Components Usage](./src/components/USAGE.md) - Hướng dẫn sử dụng components
- [🔌 API Setup](./API_SETUP.md) - API client & authentication setup

## 🗺️ Roadmap

### Phase 1: Foundation ✅

- [x] Project setup
- [x] Authentication system
- [x] Layout components (Sidebar, Header, Footer)
- [x] UI component library (Button, Card, Input)
- [x] API client với interceptors
- [x] Real-time provider

### Phase 2: Core Features (In Progress)

- [ ] Dashboard page
- [ ] Projects management
- [ ] Tasks management (Kanban board)
- [ ] Team management
- [ ] Calendar view

### Phase 3: Advanced Features

- [ ] Reports & Analytics
- [ ] Notifications system
- [ ] File uploads
- [ ] Comments & Activity log
- [ ] Settings & User profile

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

CHAAX Team - Project Management System

---

**Made with ❤️ using Next.js & TypeScript**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
