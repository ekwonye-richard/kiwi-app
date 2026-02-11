"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Button from "../Button";
import { KiwiLogo } from "@/vectors/KiwiLogo";
import styles from "./Lobby.module.css";
import { TrueLayerLogo } from "@/vectors";
import { useRouter } from "next/navigation";
import type {
  DashboardAccountData,
  DashboardDateRange,
  DashboardExportData,
} from "../Dashboard";

const DASHBOARD_STORAGE_KEY = "dashboard_accounts";
const DASHBOARD_DATE_RANGE_STORAGE_KEY = "dashboard_date_range";

const Lobby = () => {
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.clear();
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/truelayer/connect";
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      let accounts: DashboardAccountData[] = [];
      let dateRange: DashboardDateRange | null = null;

      if (Array.isArray(parsed)) {
        accounts = parsed as DashboardAccountData[];
      } else if (
        typeof parsed === "object" &&
        parsed !== null &&
        "accounts" in parsed &&
        Array.isArray(parsed.accounts)
      ) {
        const exportData = parsed as DashboardExportData;
        accounts = exportData.accounts;
        dateRange = exportData.dateRange ?? null;
      } else {
        throw new Error("Expected dashboard export JSON with accounts array.");
      }

      sessionStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(accounts));
      if (dateRange?.startMonth && dateRange?.endMonth) {
        sessionStorage.setItem(
          DASHBOARD_DATE_RANGE_STORAGE_KEY,
          JSON.stringify(dateRange),
        );
      } else {
        sessionStorage.removeItem(DASHBOARD_DATE_RANGE_STORAGE_KEY);
      }
      setImportError(null);
      router.push("/dashboard");
    } catch (error) {
      setImportError(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed: invalid JSON file.",
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <span className={styles.kiwiLogo}>
          <KiwiLogo />
        </span>
        <div className={styles.dataActions}>
          <Button size="medium" onClick={handleConnect}>
            <TrueLayerLogo /> Connect accounts
          </Button>
          <Button size="medium" variant="secondary" onClick={handleImportClick}>
            Import data
          </Button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className={styles.importInput}
          onChange={handleImportData}
        />
        {importError ? <small>{importError}</small> : null}
      </div>
    </main>
  );
};

export default Lobby;
