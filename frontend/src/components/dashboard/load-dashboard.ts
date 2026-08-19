import "server-only";

import { getDashboard } from "@/lib/server/stock-daejang-api";

import type { DashboardResponse } from "./types";

export async function loadDashboard(): Promise<DashboardResponse> {
  return getDashboard();
}
