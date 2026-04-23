import type { ReadonlyURLSearchParams } from "next/navigation";
import type { BoardDetails } from "@/lib/api/board";
import type { BoardTaskList } from "@/lib/api/task";

function createId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

export function createFallbackBoard(
  boardId: string,
  searchParams?: ReadonlyURLSearchParams | URLSearchParams | null,
): BoardDetails {
  const name = searchParams?.get("name") || "Lab_IOT";
  const description =
    searchParams?.get("description") || "Board demo cho quản lý công việc.";
  const backgroundType =
    (searchParams?.get("bgType") as BoardDetails["backgroundType"]) || "IMAGE";
  const backgroundValue =
    searchParams?.get("bgValue") ||
    "https://images.unsplash.com/photo-1517821365201-7734f463f4b5?auto=format&fit=crop&w=1600&q=80";

  return {
    id: boardId,
    name,
    description,
    visibility: "WORKSPACE",
    workspaceId: searchParams?.get("workspaceId") || undefined,
    background:
      backgroundType === "IMAGE" ? backgroundValue : undefined,
    backgroundType,
    backgroundValue,
    archived: false,
    members: [
      {
        id: "member-1",
        userId: "member-1",
        fullName: "Hà Mạnh Cường",
        role: "OWNER",
      },
      {
        id: "member-2",
        userId: "member-2",
        fullName: "Anh Lê Hoàng",
        role: "MEMBER",
      },
      {
        id: "member-3",
        userId: "member-3",
        fullName: "Trần Thị Phương",
        role: "MEMBER",
      },
    ],
    labels: [
      { id: "label-1", name: "Backend", color: "#2563EB" },
      { id: "label-2", name: "Frontend", color: "#7C3AED" },
      { id: "label-3", name: "Bug", color: "#DC2626" },
    ],
  };
}

export function createFallbackTaskLists(boardId: string): BoardTaskList[] {
  return [
    {
      id: createId("list", 1),
      boardId,
      name: "Todo",
      position: 1000,
      tasks: [
        {
          id: createId("task", 1),
          title: "Giai đoạn 1: Phân tích & Thiết kế",
          description:
            "Chốt yêu cầu, use case, ERD và sơ đồ service cho hệ thống.",
          priority: "HIGH",
          status: "TODO",
          dueDate: "2026-05-02T00:00:00",
          position: 1000,
          attachmentCount: 0,
          commentCount: 2,
          checklistCount: 1,
        },
        {
          id: createId("task", 2),
          title: "Giai đoạn 2: Phát triển Backend & CSDL",
          description:
            "Hoàn thiện board-service, task-service và DTO cho frontend.",
          priority: "URGENT",
          status: "IN_PROGRESS",
          dueDate: "2026-05-08T00:00:00",
          position: 2000,
          attachmentCount: 1,
          commentCount: 3,
          checklistCount: 2,
        },
      ],
    },
    {
      id: createId("list", 2),
      boardId,
      name: "Bug",
      position: 2000,
      tasks: [
        {
          id: createId("task", 3),
          title: "Fix refresh token flow",
          description:
            "Xử lý redirect login khi refresh fail và cleanup queue request.",
          priority: "HIGH",
          status: "IN_PROGRESS",
          dueDate: "2026-04-28T00:00:00",
          position: 1000,
          attachmentCount: 0,
          commentCount: 1,
          checklistCount: 0,
        },
      ],
    },
    {
      id: createId("list", 3),
      boardId,
      name: "Done code",
      position: 3000,
      tasks: [
        {
          id: createId("task", 4),
          title: "Tạo giao diện tạo board",
          description:
            "Modal tạo board, chọn background ảnh/màu và visibility.",
          priority: "MEDIUM",
          status: "DONE",
          dueDate: "2026-04-20T00:00:00",
          position: 1000,
          attachmentCount: 2,
          commentCount: 4,
          checklistCount: 1,
        },
      ],
    },
    {
      id: createId("list", 4),
      boardId,
      name: "Documents chờ duyệt",
      position: 4000,
      tasks: [
        {
          id: createId("task", 5),
          title: "Usecase diagram",
          description: "Kiểm tra lại luồng workspace, board, tasklist và task.",
          priority: "LOW",
          status: "TODO",
          dueDate: "2026-05-05T00:00:00",
          position: 1000,
          attachmentCount: 1,
          commentCount: 0,
          checklistCount: 0,
        },
        {
          id: createId("task", 6),
          title: "Link Figma",
          description: "Review board detail và spacing của task card.",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: null,
          position: 2000,
          attachmentCount: 1,
          commentCount: 2,
          checklistCount: 0,
        },
      ],
    },
  ];
}
