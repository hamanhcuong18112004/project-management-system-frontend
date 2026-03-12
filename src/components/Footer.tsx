"use client";

import React from "react";
import Link from "next/link";
import { Github, Mail, Twitter } from "lucide-react";
import { APP_CONFIG } from "@/config";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-auto"
      style={{
        backgroundColor: "var(--primary-color)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Description */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <div className="scale-[0.4] origin-left -ml-4">
                <Logo scale={1} />
              </div>
            </Link>
            <p className="text-white/70 text-sm mb-4">
              {APP_CONFIG.description}
            </p>
            <p className="text-white/50 text-xs">
              Version {APP_CONFIG.version}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/team"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  Team
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Connect</h3>
            <div className="flex gap-3 mb-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                aria-label="GitHub"
              >
                <Github size={18} className="text-white" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                aria-label="Twitter"
              >
                <Twitter size={18} className="text-white" />
              </a>
              <a
                href="mailto:contact@chaax.com"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                aria-label="Email"
              >
                <Mail size={18} className="text-white" />
              </a>
            </div>
            <p className="text-white/70 text-sm">
              Need help?{" "}
              <a
                href="mailto:support@chaax.com"
                className="text-white hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {currentYear} {APP_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
