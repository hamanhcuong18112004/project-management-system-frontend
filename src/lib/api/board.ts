import apiClient from "./client";
import type {
  Board,
  BoardBackgroundType,
  BoardVisibility,
} from "./workspace";

const BOARD_BASE_PATH = "board";

type ServiceEnvelope<T> = {
  data?: T;
  message?: string;
  status?: string;
  success?: boolean;
};

export interface BoardMemberSummary {
  id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export interface BoardLabelSummary {
  id?: string;
  name?: string;
  color?: string;
}

export interface BoardDetails extends Board {
  ownerId?: string | null;
  visibility: BoardVisibility;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  members?: BoardMemberSummary[];
  labels?: BoardLabelSummary[];
}

export interface CreateBoardPayload {
  name: string;
  description?: string;
  workspaceId: string;
  ownerId?: string;
  visibility?: BoardVisibility;
  archived?: boolean;
  backgroundType?: BoardBackgroundType;
  backgroundValue?: string;
}

export interface UpdateBoardPayload {
  name?: string;
  description?: string;
  visibility?: BoardVisibility;
  archived?: boolean;
  backgroundType?: BoardBackgroundType;
  backgroundValue?: string;
}

export interface ReplaceBoardMembersPayload {
  userIds: string[];
}

function unwrapResponse<T>(payload: ServiceEnvelope<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    ("status" in payload || "success" in payload || "data" in payload)
  ) {
    const envelope = payload as ServiceEnvelope<T>;

    if (typeof envelope.success === "boolean" && !envelope.success) {
      throw new Error(envelope.message || "Board service request failed.");
    }

    if (envelope.status && envelope.status !== "success") {
      throw new Error(envelope.message || "Board service request failed.");
    }

    if (typeof envelope.data !== "undefined") {
      return envelope.data;
    }
  }

  return payload as T;
}

function inferBackgroundType(value?: string): BoardBackgroundType | undefined {
  if (!value) {
    return undefined;
  }

  if (/^https?:\/\//.test(value)) {
    return "IMAGE";
  }

  return "COLOR";
}

export function normalizeBoard(raw: Record<string, unknown>): BoardDetails {
  const background = raw.background as
    | string
    | {
        imageUrl?: string;
        type?: BoardBackgroundType;
        value?: string;
      }
    | null
    | undefined;
  const backgroundObject =
    background && typeof background === "object" ? background : undefined;

  const backgroundValue =
    (typeof background === "string" ? background : undefined) ||
    backgroundObject?.value ||
    backgroundObject?.imageUrl ||
    (raw.backgroundValue as string | undefined) ||
    undefined;

  const backgroundType =
    (raw.backgroundType as BoardBackgroundType | undefined) ||
    backgroundObject?.type ||
    inferBackgroundType(backgroundValue);

  return {
    id: String(raw.id || ""),
    name: String(raw.name || "Board"),
    description: (raw.description as string | null | undefined) ?? null,
    workspaceId: raw.workspaceId ? String(raw.workspaceId) : undefined,
    ownerId: raw.ownerId ? String(raw.ownerId) : undefined,
    visibility:
      (raw.visibility as BoardVisibility | undefined) || "WORKSPACE",
    archived: Boolean(raw.archived),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    background:
      backgroundValue && backgroundType === "IMAGE" ? backgroundValue : undefined,
    backgroundType,
    backgroundValue,
    members: Array.isArray(raw.members)
      ? (raw.members as BoardMemberSummary[])
      : [],
    labels: Array.isArray(raw.labels) ? (raw.labels as BoardLabelSummary[]) : [],
  };
}

export async function getBoardById(boardId: string): Promise<BoardDetails> {
  const response = await apiClient.get<
    ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
  >(
    `${BOARD_BASE_PATH}/${boardId}`,
  );

  return normalizeBoard(unwrapResponse(response.data));
}

export async function getBoardsByWorkspace(
  workspaceId: string,
  userId?: string,
): Promise<BoardDetails[]> {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const response = await apiClient.get<
    ServiceEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]
  >(
    `${BOARD_BASE_PATH}/workspace/${workspaceId}${params}`,
  );

  return unwrapResponse(response.data).map((board) => normalizeBoard(board));
}

/**
 * Returns all boards the user is directly a BoardMember of.
 * This includes boards in workspaces the user is NOT a workspace member of.
 */
export async function getBoardsByUser(userId: string): Promise<BoardDetails[]> {
  const response = await apiClient.get<
    ServiceEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]
  >(
    `${BOARD_BASE_PATH}/user?userId=${encodeURIComponent(userId)}`,
  );

  return unwrapResponse(response.data).map((board) => normalizeBoard(board));
}

export async function createBoard(
  payload: CreateBoardPayload,
): Promise<BoardDetails> {
  const response = await apiClient.post<
    ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
  >(
    `${BOARD_BASE_PATH}`,
    payload,
  );

  return normalizeBoard(unwrapResponse(response.data));
}

export async function lookupUserByEmail(
  email: string,
): Promise<{ userId: string; email: string }> {
  const response = await apiClient.get<
    { userId: string; email: string } | ServiceEnvelope<{ userId: string; email: string }>
  >(
    `${BOARD_BASE_PATH}/users/lookup?email=${encodeURIComponent(email)}`,
  );
  const data = unwrapResponse(response.data) as { userId: string; email: string };
  if (!data?.userId) {
    throw new Error("Không tìm thấy người dùng với email này.");
  }
  return data;
}

export async function updateBoard(
  boardId: string,
  payload: UpdateBoardPayload,
): Promise<BoardDetails> {
  const response = await apiClient.put<
    ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
  >(
    `${BOARD_BASE_PATH}/${boardId}`,
    payload,
  );

  return normalizeBoard(unwrapResponse(response.data));
}

export async function deleteBoard(boardId: string): Promise<void> {
  await apiClient.delete(`${BOARD_BASE_PATH}/${boardId}`);
}

export async function replaceBoardMembers(
  boardId: string,
  payload: ReplaceBoardMembersPayload,
): Promise<BoardDetails> {
  const response = await apiClient.put<
    ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
  >(
    `${BOARD_BASE_PATH}/${boardId}/members`,
    payload,
  );

  return normalizeBoard(unwrapResponse(response.data));
}

export async function joinBoard(
  boardId: string,
  userId: string,
): Promise<BoardDetails> {
  const response = await apiClient.post<
    ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
  >(
    `${BOARD_BASE_PATH}/${boardId}/join?userId=${encodeURIComponent(userId)}`,
  );

  return normalizeBoard(unwrapResponse(response.data));
}

export async function updateBoardMemberRole(
  boardId: string,
  userId: string,
  role: string,
  requesterId?: string,
): Promise<BoardDetails> {
  const response = await apiClient.patch<
    ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
  >(
    `${BOARD_BASE_PATH}/${boardId}/members/${encodeURIComponent(userId)}${requesterId ? `?requesterId=${encodeURIComponent(requesterId)}` : ""}`,
    { role },
  );

  return normalizeBoard(unwrapResponse(response.data));
}

export async function removeBoardMember(
  boardId: string,
  userId: string,
  requesterId?: string,
): Promise<BoardDetails> {
  const response = await apiClient.delete<
    ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
  >(
    `${BOARD_BASE_PATH}/${boardId}/members/${encodeURIComponent(userId)}${requesterId ? `?requesterId=${encodeURIComponent(requesterId)}` : ""}`,
  );

  return normalizeBoard(unwrapResponse(response.data));
}
