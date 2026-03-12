export interface Task {
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    assignee: {
        name: string;
        avatar?: string;
    };
    progress: number;
    description?: string;
    order?: number;
}

export interface Column {
    id: string;
    name: string;
    tasks: Task[];
}

export interface Module {
    id: string;
    name: string;
    color: string;
    columns: Column[];
}
