import "server-only";

import { loadDashboardSnapshot } from "@/lib/server/stock-daejang-api";

import type { DashboardSnapshot } from "./types";

export async function loadDashboard(): Promise<DashboardSnapshot> {
  return loadDashboardSnapshot();
}
