import type { CSSProperties } from "react";
import type {
  Board,
  BoardBackgroundType,
  BoardVisibility,
} from "@/lib/api/workspace";

export type BoardBackgroundPreset = {
  id: string;
  label: string;
  type: BoardBackgroundType;
  value: string;
};

export const BOARD_IMAGE_PRESETS: BoardBackgroundPreset[] = [
  {
    id: "desert-road",
    label: "Sa mạc",
    type: "IMAGE",
    value:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "forest-stream",
    label: "Rừng",
    type: "IMAGE",
    value:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "lake-mountain",
    label: "Hồ núi",
    type: "IMAGE",
    value:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "night-sky",
    label: "Bầu trời đêm",
    type: "IMAGE",
    value:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "violet-mountain",
    label: "Tím hoàng hôn",
    type: "IMAGE",
    value:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "snow-peak",
    label: "Núi tuyết",
    type: "IMAGE",
    value:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
  },
];

export const BOARD_COLOR_PRESETS: BoardBackgroundPreset[] = [
  {
    id: "ocean-blue",
    label: "Xanh biển",
    type: "COLOR",
    value: "linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)",
  },
  {
    id: "deep-navy",
    label: "Xanh đậm",
    type: "COLOR",
    value: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
  },
  {
    id: "violet-pop",
    label: "Tím",
    type: "COLOR",
    value: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
  },
  {
    id: "berry",
    label: "Berry",
    type: "COLOR",
    value: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
  },
  {
    id: "sunset",
    label: "Hoàng hôn",
    type: "COLOR",
    value: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
  },
  {
    id: "midnight",
    label: "Đêm sâu",
    type: "COLOR",
    value: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  },
];

export const DEFAULT_BOARD_VISIBILITY: BoardVisibility = "WORKSPACE";

export const DEFAULT_BOARD_BACKGROUND = BOARD_IMAGE_PRESETS[0];

export function getBoardBackgroundStyle(
  backgroundType?: BoardBackgroundType,
  backgroundValue?: string,
  fallback?: string,
): CSSProperties {
  const resolvedValue = backgroundValue || fallback;

  if (!resolvedValue) {
    return {
      backgroundImage: "linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)",
    };
  }

  if (
    backgroundType === "IMAGE" ||
    (!backgroundType && /^https?:\/\//.test(resolvedValue))
  ) {
    return {
      backgroundImage: `url(${resolvedValue})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  if (
    resolvedValue.startsWith("linear-gradient(") ||
    resolvedValue.startsWith("radial-gradient(")
  ) {
    return {
      backgroundImage: resolvedValue,
    };
  }

  return {
    backgroundColor: resolvedValue,
  };
}

export function getBoardCoverStyle(
  board: Pick<Board, "background" | "backgroundType" | "backgroundValue">,
): CSSProperties {
  return getBoardBackgroundStyle(
    board.backgroundType,
    board.backgroundValue,
    board.background,
  );
}
