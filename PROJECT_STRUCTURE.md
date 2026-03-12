# 📂 Project Structure - CHAAX Project Management System

## 🗂️ Folder Structure Overview

```
src/
├── app/                    # Next.js App Router - Pages & Routing
│   ├── layout.tsx         # Root layout với providers
│   ├── page.tsx           # Homepage
│   ├── loading.tsx        # Global loading state
│   ├── error.tsx          # Global error boundary
│   ├── not-found.tsx      # 404 page
│   ├── globals.css        # Global styles & CSS variables
│   └── [routes]/          # Route folders (dashboard, projects, etc.)
│
├── components/            # Shared Components (Layout & UI)
│   ├── Logo.tsx          # CHAAX logo component
│   ├── LoadingPage.tsx   # Full-page loading spinner
│   ├── ErrorPage.tsx     # Full-page error display
│   ├── NotFoundPage.tsx  # Full-page 404 display
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── Header.tsx        # Top header với search & user menu
│   ├── Footer.tsx        # Footer với links & social
│   ├── MainLayout.tsx    # Layout wrapper (Sidebar + Header + Footer)
│   ├── ui/               # Reusable UI components
│   └── index.ts          # Component exports
│
├── config/               # Configuration Files
│   ├── theme.ts         # Colors, z-index, breakpoints
│   ├── app.ts           # App config, API URLs, routes
│   └── index.ts         # Config exports
│
├── hooks/               # Custom React Hooks
│   └── (empty)          # Sẽ chứa: useDebounce, useLocalStorage, etc.
│
├── lib/                 # Libraries & Utilities
│   ├── api/            # API Client & HTTP utilities
│   │   ├── client.ts   # Axios instance với auth interceptors
│   │   └── index.ts    # API exports
│   ├── stores/         # Zustand State Management
│   │   ├── useAuthStore.ts  # Authentication state
│   │   └── index.ts    # Store exports
│   ├── helper/         # Helper Functions
│   │   ├── formatTime.ts   # Date/time formatting
│   │   └── groupBy.ts      # Array grouping utility
│   ├── utils/          # General Utilities
│   └── constants/      # App-wide constants
│
├── providers/          # React Context Providers
│   ├── AuthProvider.tsx      # Authentication context
│   ├── RealtimeProvider.tsx  # WebSocket realtime updates
│   └── index.ts        # Provider exports
│
└── types/             # TypeScript Type Definitions
    └── index.ts       # Global types & interfaces
```

---

## 📁 Chi tiết từng folder:

### 1. **`app/` - Next.js App Router**

Folder chứa **pages** và **routing** theo chuẩn Next.js 14+ App Router.

**Các file đặc biệt:**

- `layout.tsx` - Root layout, wrap toàn bộ app với providers
- `loading.tsx` - Auto hiển thị khi route đang load
- `error.tsx` - Auto catch errors trong route
- `not-found.tsx` - Auto hiển thị cho 404

**Cách tạo routes:**

```
app/
├── dashboard/
│   └── page.tsx          → /dashboard
├── projects/
│   ├── page.tsx          → /projects
│   └── [id]/
│       └── page.tsx      → /projects/:id
└── tasks/
    └── page.tsx          → /tasks
```

**Ví dụ page.tsx:**

```tsx
import { MainLayout } from "@/components";

export default function DashboardPage() {
    return (
        <MainLayout>
            <h1>Dashboard Content</h1>
        </MainLayout>
    );
}
```

---

### 2. **`components/` - Shared Components**

Chứa tất cả **components dùng chung** trong app.

**Phân loại:**

#### **A. Layout Components** (đã có)

- `Sidebar.tsx` - Navigation sidebar (có thể collapse)
- `Header.tsx` - Top header với search & user menu
- `Footer.tsx` - Footer với links & social
- `MainLayout.tsx` - Wrapper combine Sidebar + Header + Footer

#### **B. Page Components** (đã có)

- `Logo.tsx` - CHAAX logo
- `LoadingPage.tsx` - Full-page loading
- `ErrorPage.tsx` - Full-page error
- `NotFoundPage.tsx` - 404 page

#### **C. UI Components** (sẽ tạo trong `components/ui/`)

Các reusable UI components:

- `Button.tsx` - Button component với variants
- `Input.tsx` - Input field với validation
- `Card.tsx` - Card container
- `Modal.tsx` - Modal/Dialog
- `Dropdown.tsx` - Dropdown menu
- `Badge.tsx` - Status badge
- `Avatar.tsx` - User avatar
- `Table.tsx` - Data table
- `Tabs.tsx` - Tab navigation
- `Toast.tsx` - Toast notification

**Ví dụ sử dụng:**

```tsx
import { MainLayout, Button, Card } from "@/components";

export default function MyPage() {
    return (
        <MainLayout>
            <Card>
                <Button variant="primary">Click me</Button>
            </Card>
        </MainLayout>
    );
}
```

---

### 3. **`config/` - Configuration**

Chứa các **configuration files** cho app.

**Files hiện có:**

- `theme.ts` - Colors, z-index, breakpoints constants
- `app.ts` - App name, API URLs, routes constants
- `index.ts` - Export tập trung

**Ví dụ sử dụng:**

```tsx
import { COLORS, ROUTES, APP_CONFIG } from "@/config";

// Sử dụng colors
const button = <div style={{ backgroundColor: COLORS.primary.DEFAULT }} />;

// Sử dụng routes
<Link href={ROUTES.dashboard}>Dashboard</Link>;

// Sử dụng app config
console.log(APP_CONFIG.name); // "CHAAX Project Management"
```

---

### 4. **`hooks/` - Custom React Hooks**

Chứa các **custom hooks** tái sử dụng.

**Các hooks nên có:**

```tsx
// useDebounce.ts - Debounce value changes
export function useDebounce<T>(value: T, delay: number): T;

// useLocalStorage.ts - Sync state với localStorage
export function useLocalStorage<T>(key: string, initialValue: T);

// useMediaQuery.ts - Responsive breakpoints
export function useMediaQuery(query: string): boolean;

// useClickOutside.ts - Detect click outside element
export function useClickOutside(ref: RefObject, handler: () => void);

// useAsync.ts - Handle async operations
export function useAsync<T>(asyncFunction: () => Promise<T>);
```

**Ví dụ sử dụng:**

```tsx
import { useDebounce } from "@/hooks/useDebounce";

function SearchComponent() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        // API call với debounced value
        fetchResults(debouncedSearch);
    }, [debouncedSearch]);
}
```

---

### 5. **`lib/` - Libraries & Utilities**

#### **A. `lib/api/` - API Client**

- `client.ts` - Axios instance với:
    - Auto attach Bearer token
    - Auto refresh token on 401
    - Request/response interceptors
    - Error handling

**Ví dụ:**

```tsx
import { apiClient } from "@/lib/api";

// GET request
const response = await apiClient.get("/projects");

// POST request
await apiClient.post("/projects", { name: "New Project" });
```

#### **B. `lib/stores/` - State Management (Zustand)**

- `useAuthStore.ts` - Authentication state
- Có thể thêm: `useProjectStore.ts`, `useTaskStore.ts`, etc.

**Ví dụ:**

```tsx
import { useAuthStore } from "@/lib/stores";

function MyComponent() {
    const { user, isAuthenticated, logout } = useAuthStore();

    return (
        <div>
            {isAuthenticated && <p>Welcome {user?.name}</p>}
            <button onClick={logout}>Logout</button>
        </div>
    );
}
```

#### **C. `lib/helper/` - Helper Functions**

Các utility functions nhỏ:

- `formatTime.ts` - Format dates/times
- `groupBy.ts` - Group array by key

#### **D. `lib/utils/` - General Utilities**

Các utilities phức tạp hơn:

- Validation functions
- Data transformation
- Calculation utilities

---

### 6. **`providers/` - React Context Providers**

Chứa các **Context Providers** wrap toàn bộ app.

**Providers hiện có:**

- `AuthProvider.tsx` - Authentication context wrapper
- `RealtimeProvider.tsx` - WebSocket realtime updates

**Cách sử dụng trong `app/layout.tsx`:**

```tsx
import { AuthProvider, RealtimeProvider } from "@/providers";

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <AuthProvider>
                    <RealtimeProvider>{children}</RealtimeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
```

---

### 7. **`types/` - TypeScript Types**

Chứa **type definitions** & **interfaces** dùng chung.

**Nên có:**

```typescript
// types/index.ts

// User types
export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "member" | "guest";
    avatar?: string;
}

// Project types
export interface Project {
    id: string;
    name: string;
    description: string;
    status: "active" | "archived" | "completed";
    createdAt: Date;
    members: User[];
}

// Task types
export interface Task {
    id: string;
    title: string;
    description: string;
    status: "todo" | "in-progress" | "done";
    priority: "low" | "medium" | "high";
    assignee?: User;
    dueDate?: Date;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
```

---

## 🎨 Design System

### Colors (từ `config/theme.ts`)

```css
--primary-color: #1e3a5f (Navy Blue) --secondary-color: #eab308 (Gold/Yellow);
```

### Components Style Guide

- **Primary buttons**: Background = secondary color (gold)
- **Sidebar/Header/Footer**: Background = primary color (navy)
- **Text on primary**: White
- **Hover states**: Opacity hoặc lighter shade

---

## 🚀 Workflow & Best Practices

### 1. **Tạo một trang mới:**

```bash
# 1. Tạo route folder
src/app/projects/page.tsx

# 2. Sử dụng MainLayout
import { MainLayout } from "@/components";

export default function ProjectsPage() {
  return <MainLayout>Content here</MainLayout>;
}
```

### 2. **Tạo một component UI mới:**

```bash
# 1. Tạo file trong components/ui/
src/components/ui/Button.tsx

# 2. Export trong components/ui/index.ts
export { Button } from "./Button";

# 3. Re-export trong components/index.ts
export * from "./ui";
```

### 3. **Tạo custom hook:**

```bash
# 1. Tạo file trong hooks/
src/hooks/useDebounce.ts

# 2. Export default
export function useDebounce<T>(value: T, delay: number): T { ... }

# 3. Import và dùng
import { useDebounce } from "@/hooks/useDebounce";
```

### 4. **Tạo API endpoint:**

```tsx
// lib/api/projects.ts
import { apiClient } from "./client";

export const projectsApi = {
    getAll: () => apiClient.get("/projects"),
    getById: (id: string) => apiClient.get(`/projects/${id}`),
    create: (data) => apiClient.post("/projects", data),
    update: (id, data) => apiClient.put(`/projects/${id}`, data),
    delete: (id) => apiClient.delete(`/projects/${id}`),
};
```

---

## 📦 Dependencies Summary

- **Next.js 14+** - Framework
- **React 18+** - UI Library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Socket.io Client** - WebSocket

---

## 🔧 Environment Variables

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=http://localhost:8080
```

---

## ✅ Checklist Setup

- [x] API Client với auth interceptors
- [x] Auth Store (Zustand)
- [x] Providers (Auth, Realtime)
- [x] Layout components (Sidebar, Header, Footer)
- [x] Loading/Error/404 pages
- [x] Config files (theme, app)
- [ ] UI Components library (trong components/ui/)
- [ ] Custom hooks (trong hooks/)
- [ ] Type definitions (trong types/)
- [ ] API services layer (trong lib/api/)

---

**🎯 Next Steps:**

1. Tạo các UI components trong `components/ui/`
2. Tạo các custom hooks trong `hooks/`
3. Define types trong `types/`
4. Tạo các trang chính (dashboard, projects, tasks, etc.)
5. Implement business logic & API integration
