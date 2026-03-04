"use client";

import { KiwiLogo } from "@/vectors/KiwiLogo";
import { ReactNode } from "react";
import Button from "../Button";
import styles from "./DashboardHeader.module.css";
import type {
  DashboardAccountData,
  DashboardDateRange,
  DashboardExportData,
} from "../Dashboard";

type DashboardHeaderProps = {
  accounts: DashboardAccountData[];
  dateRange?: DashboardDateRange | null;
  logoutHref?: string;
  exportFilenamePrefix?: string;
  showExportButton?: boolean;
  dashboardLogo?: ReactNode;
};

const DashboardHeader = ({
  accounts,
  dateRange,
  logoutHref = "/",
  exportFilenamePrefix = "kiwi-data",
  showExportButton = true,
  dashboardLogo,
}: DashboardHeaderProps) => {
  const handleExportData = () => {
    const exportData: DashboardExportData = {
      accounts,
      dateRange: dateRange ?? null,
    };
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportFilenamePrefix}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = logoutHref;
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoGroup}>
        <span className={styles.kiwiLogo}>
          <KiwiLogo />
        </span>
        {dashboardLogo ? (
          <span className={styles.dashboardLogo}>{dashboardLogo}</span>
        ) : null}
      </div>
      <div className={styles.headerActions}>
        {showExportButton ? (
          <Button onClick={handleExportData}>Export data</Button>
        ) : null}
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
