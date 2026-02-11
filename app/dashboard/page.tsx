"use client";

import Dashboard, {
  type DashboardAccountData,
  type DashboardDateRange,
} from "@/components/Dashboard";
import Link from "next/link";
import { useState } from "react";

const STORAGE_KEY = "dashboard_accounts";
const DATE_RANGE_STORAGE_KEY = "dashboard_date_range";

export default function DashboardPage() {
  const [accounts] = useState<DashboardAccountData[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as DashboardAccountData[];
    } catch {
      return [];
    }
  });
  const [dateRange] = useState<DashboardDateRange | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = sessionStorage.getItem(DATE_RANGE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as DashboardDateRange;
    } catch {
      return null;
    }
  });

  if (accounts.length === 0) {
    return (
      <main>
        <p>No dashboard data found.</p>
        <Link href="/callback">Back to connected accounts</Link>
      </main>
    );
  }

  return <Dashboard accounts={accounts} dateRange={dateRange} />;
}
