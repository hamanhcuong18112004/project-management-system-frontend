export const APP_CONFIG = {
    name: "CHAAX Project Management",
    shortName: "CHAAX",
    description: "Professional Project Management System",
    version: "1.0.0",
    author: "CHAAX Team",
} as const;

export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    wsURL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8084/ws/boards",
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
    settings: "/profile",
    profile: "/profile",
    invitations: "/invitations",
    drafts: "/drafts",
    login: "/login",
    register: "/register",
} as const;


