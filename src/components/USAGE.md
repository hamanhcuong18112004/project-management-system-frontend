# 🎨 Components Usage Guide

## Layout Components

### MainLayout

Wrapper chính cho tất cả các trang, bao gồm Sidebar, Header và Footer.

```tsx
import { MainLayout } from "@/components";

export default function MyPage() {
    return (
        <MainLayout>
            <h1>Page Content</h1>
        </MainLayout>
    );
}
```

---

## UI Components

### Button

Nút bấm với nhiều variants và sizes.

```tsx
import { Button } from "@/components";

// Primary button (gold background)
<Button variant="primary" size="md">
  Save Changes
</Button>

// Secondary button (navy background)
<Button variant="secondary">
  Cancel
</Button>

// Outline button
<Button variant="outline" onClick={handleClick}>
  Learn More
</Button>

// Loading state
<Button isLoading>
  Processing...
</Button>

// Disabled
<Button disabled>
  Unavailable
</Button>
```

**Props:**

- `variant`: "primary" | "secondary" | "outline" | "ghost" | "danger"
- `size`: "sm" | "md" | "lg"
- `isLoading`: boolean
- All standard button HTML attributes

---

### Card

Container component cho nội dung.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components";

<Card hover>
    <CardHeader>
        <CardTitle>Project Overview</CardTitle>
    </CardHeader>
    <CardContent>
        <p>Your content here...</p>
    </CardContent>
</Card>;
```

**Props:**

- `padding`: "none" | "sm" | "md" | "lg"
- `hover`: boolean - thêm shadow khi hover

---

### Input

Input field với label, error và helper text.

```tsx
import { Input } from "@/components";

<Input
    label="Email"
    type="email"
    placeholder="Enter your email"
    error={errors.email}
    helperText="We'll never share your email"
/>;
```

**Props:**

- `label`: string
- `error`: string - error message
- `helperText`: string - helper text
- All standard input HTML attributes

---

## Page Components

### Logo

CHAAX logo với size tùy chỉnh.

```tsx
import { Logo } from "@/components";

<Logo size={320} /> // Default 320px
<Logo size={200} /> // Smaller
```

---

### LoadingPage

Full-page loading spinner (tự động dùng bởi Next.js).

```tsx
import { LoadingPage } from "@/components";

<LoadingPage />;
```

---

### ErrorPage

Full-page error display (tự động dùng bởi Next.js).

```tsx
import { ErrorPage } from "@/components";

<ErrorPage />;
```

---

### NotFoundPage

Full-page 404 display (tự động dùng bởi Next.js).

```tsx
import { NotFoundPage } from "@/components";

<NotFoundPage />;
```

---

## Example: Complete Page

```tsx
import {
    MainLayout,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
} from "@/components";
import { useState } from "react";

export default function ProjectsPage() {
    const [name, setName] = useState("");

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Projects</h1>
                    <Button variant="primary">+ New Project</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create New Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input
                                label="Project Name"
                                placeholder="Enter project name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Button variant="primary">Create Project</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
```

---

## Styling Guide

### Colors

```tsx
// CSS Variables (trong globals.css)
--primary-color: #1e3a5f   // Navy Blue
--secondary-color: #eab308  // Gold/Yellow

// Sử dụng trong Tailwind
className="bg-[var(--primary-color)]"
className="text-[var(--secondary-color)]"

// Hoặc từ config
import { COLORS } from "@/config";
style={{ backgroundColor: COLORS.primary.DEFAULT }}
```

### Responsive

```tsx
// Mobile first approach
<div className="w-full md:w-1/2 lg:w-1/3">Content</div>
```

---

## Best Practices

1. **Luôn dùng MainLayout** cho các trang chính
2. **Import từ @/components** thay vì relative paths
3. **Sử dụng UI components** thay vì tạo mới
4. **Consistent spacing** với Tailwind classes
5. **Accessible**: Luôn có `aria-label` cho icon buttons
