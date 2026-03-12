/**
 * Theme colors configuration
 * Sử dụng màu từ CSS variables trong globals.css
 */
export const COLORS = {
    // Primary colors
    primary: {
        DEFAULT: "#1e3a5f", // Navy blue - màu chính
        dark: "#152d4a",
        light: "#2a5a8f",
    },
    // Secondary colors
    secondary: {
        DEFAULT: "#eab308", // Gold/Yellow - màu phụ
        light: "#facc15",
        dark: "#ca8a04",
    },
    // Neutral colors
    neutral: {
        white: "#FFFFFF",
        gray: {
            50: "#F8FAFB",
            100: "#F1F5F9",
            200: "#E2E8F0",
            300: "#CBD5E1",
            400: "#94A3B8",
            500: "#64748B",
            600: "#475569",
            700: "#334155",
            800: "#1E293B",
            900: "#0F172A",
        },
    },
    // Status colors
    status: {
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
    },
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
    base: 0,
    dropdown: 100,
    overlay: 200,
    modal: 300,
    toast: 400,
    tooltip: 500,
} as const;

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
} as const;
