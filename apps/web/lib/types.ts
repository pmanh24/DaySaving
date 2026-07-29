import type { BoardResponse, Checkin } from "@saving/shared";
export type { BoardResponse, Checkin };
export interface Toast { message: string; action?: { label: string; run: () => void } }
