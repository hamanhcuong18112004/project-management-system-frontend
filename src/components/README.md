# CHAAX Components - Logo & Pages

Các component UI được tách từ Figma design cho dự án CHAAX Project Management.

## 📦 Components

### 1. **Logo** (`src/components/Logo.tsx`)

Logo CHAAX với background navy và viền đôi.

```tsx
import { Logo } from "@/components";

<Logo size={320} />; // Default 320px
```

### 2. **LoadingPage** (`src/components/LoadingPage.tsx`)

Full-page loading với animated spinner và logo CHAAX ở giữa.

```tsx
import { LoadingPage } from "@/components";

<LoadingPage />;
```

**Sử dụng tự động:** Next.js App Router sẽ hiển thị component này khi loading (file `app/loading.tsx`)

### 3. **ErrorPage** (`src/components/ErrorPage.tsx`)

Full-page error với modal hiển thị lỗi và 2 buttons: "Tải lại" và "Trang chủ".

```tsx
import { ErrorPage } from "@/components";

<ErrorPage />;
```

**Sử dụng tự động:** Next.js App Router sẽ hiển thị component này khi có error (file `app/error.tsx`)

### 4. **NotFoundPage** (`src/components/NotFoundPage.tsx`)

Full-page 404 với số 404 lớn và 2 buttons: "Quay lại" và "Trang chủ".

```tsx
import { NotFoundPage } from "@/components";

<NotFoundPage />;
```

**Sử dụng tự động:** Next.js App Router sẽ hiển thị component này cho 404 (file `app/not-found.tsx`)

## 🎨 Design System

**Colors:**

- Navy: `#1e3a5f`
- Navy Dark: `#152d4a`
- Navy Light: `#2a5a8f`
- Gold: `#eab308`
- Gold Light: `#facc15`
- White: `#FFFFFF`

**Font:** Inter (Google Fonts - đã có trong project)

## 📦 Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons

Đã được cài đặt tự động.

## 🚀 Next.js Integration

Các file đã được tạo sẵn:

- `app/loading.tsx` - Hiển thị khi loading
- `app/error.tsx` - Hiển thị khi có error
- `app/not-found.tsx` - Hiển thị cho 404

Next.js sẽ tự động sử dụng các file này!
