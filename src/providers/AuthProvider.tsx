"use client";

/**
 * AuthProvider wrapper component
 * Zustand store đã handle hydration tự động, component này chỉ để wrap
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
