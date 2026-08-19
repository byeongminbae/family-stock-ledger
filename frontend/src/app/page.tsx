import { DashboardView } from "@/components/dashboard/dashboard-view";
import { loadDashboard } from "@/components/dashboard/load-dashboard";
import { PrimitiveShowcase } from "@/components/primitive-showcase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type DashboardPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const query = await searchParams;
  if (process.env.NODE_ENV === "development" && query.preview === "components") {
    return <PrimitiveShowcase />;
  }

  const dashboard = await loadDashboard();
  return <DashboardView dashboard={dashboard} />;
}
