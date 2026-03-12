"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout - Layout chính cho ứng dụng
 * Bao gồm Sidebar, Header, Content area và Footer
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Fixed */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        {/* Header - Fixed */}
        <Header />

        {/* Page Content - Scrollable */}
        <main className="flex-1 mt-16 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
