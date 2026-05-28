"use client";

import React, { useEffect, useState } from "react";
import { Settings, Globe, Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode from localStorage or body class
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    } else {
      const theme = localStorage.getItem("theme");
      if (theme === "dark") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const initTranslate = () => {
      const element = document.getElementById("google_translate_element");
      if (element && !element.hasChildNodes()) {
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: "vi" },
          "google_translate_element"
        );
      }
    };

    (window as any).googleTranslateElementInit = initTranslate;

    // If script is already loaded, we manually initialize it
    if ((window as any).google && (window as any).google.translate) {
      initTranslate();
    } 
    // Otherwise add the script if it hasn't been added yet
    else if (!document.getElementById("google-translate-script")) {
      const addScript = document.createElement("script");
      addScript.id = "google-translate-script";
      addScript.setAttribute(
        "src",
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      );
      addScript.setAttribute("async", "true");
      document.body.appendChild(addScript);
    }

    // We intentionally don't delete googleTranslateElementInit in cleanup
    // so it doesn't throw if the script loads after component unmounts
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="text-blue-600 dark:text-blue-400" size={26} />
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tùy chỉnh giao diện và ngôn ngữ hiển thị theo sở thích của bạn.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        
        {/* Dark Mode Setting */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Chế độ tối (Dark Mode)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chuyển đổi giao diện sang màu tối để bảo vệ mắt.
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                isDarkMode ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Language Setting */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Ngôn ngữ hiển thị (Google Dịch)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sử dụng công cụ dịch tự động của Google để thay đổi ngôn ngữ toàn bộ trang.
              </p>
            </div>
          </div>
          <div className="min-w-[200px] flex justify-end">
            {/* The Google Translate widget will render inside this div */}
            <div id="google_translate_element" className="translate-wrapper rounded-md overflow-hidden"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
