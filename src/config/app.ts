export const APP_CONFIG = {
    name: "CHAAX Project Management",
    shortName: "CHAAX",
    description: "Professional Project Management System",
    version: "1.0.0",
    author: "CHAAX Team",
} as const;

export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
    wsURL: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080",
    timeout: 15000,
} as const;

export const ROUTES = {
    home: "/",
    dashboard: "/dashboard",
    projects: "/projects",
    tasks: "/tasks",
    team: "/team",
    calendar: "/calendar",
    reports: "/reports",
    settings: "/settings",
    profile: "/profile",
    login: "/login",
    register: "/register",
} as const;
