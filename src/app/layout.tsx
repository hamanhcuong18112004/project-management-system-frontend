import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";
import RealtimeProvider from "@/providers/RealtimeProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  applicationName: "TaskFlow",
  title: {
    default: "TaskFlow đỉnh cao của quản lý",
    template: "%s | TaskFlow",
  },
  description:
    "TaskFlow giúp đội nhóm quản lý dự án, phân chia công việc, theo dõi deadline, ưu tiên task quan trọng và cộng tác thời gian thực trên một nền tảng trực quan.",
  keywords: [
    "TaskFlow",
    "quản lý dự án",
    "quản lý công việc",
    "task management",
    "deadline",
    "workspace",
    "kanban",
    "AI quản lý công việc",
  ],
  authors: [{ name: "TaskFlow" }],
  creator: "TaskFlow",
  publisher: "TaskFlow",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "TaskFlow",
    title: "TaskFlow đỉnh cao của quản lý",
    description:
      "TaskFlow giúp đội nhóm quản lý dự án, phân chia công việc, theo dõi deadline, ưu tiên task quan trọng và cộng tác thời gian thực trên một nền tảng trực quan.",
    images: [
      {
        url: "/ogimage.jpeg",
        width: 1200,
        height: 630,
        alt: "TaskFlow - nền tảng quản lý dự án và công việc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskFlow đỉnh cao của quản lý",
    description:
      "TaskFlow giúp đội nhóm quản lý dự án, phân chia công việc, theo dõi deadline, ưu tiên task quan trọng và cộng tác thời gian thực.",
    images: ["/ogimage.jpeg"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <RealtimeProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </RealtimeProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          theme="light"
          toastOptions={{
            duration: 2000,
          }}
        />
      </body>
    </html>
  );
}
