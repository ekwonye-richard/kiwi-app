"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccountCheckboxCard from "../AccountCheckboxCard";
import type { TrueLayerAccount } from "@/services";
import styles from "./ConnectedAccounts.module.css";
import Button from "../Button";
import { TrueLayerLogo } from "@/vectors";

type ConnectedAccountsProps = {
  accounts: TrueLayerAccount[];
  accessToken: string;
  expiresIn: number;
  initialError?: string;
};

const CONNECTED_ACCOUNTS_STORAGE_KEY = "connected_accounts";
const CONNECTED_ACCOUNTS_CONTEXT_STORAGE_KEY = "connected_accounts_context";
const DASHBOARD_DATE_RANGE_STORAGE_KEY = "dashboard_date_range";

function mergeAccounts(
  existingAccounts: TrueLayerAccount[],
  incomingAccounts: TrueLayerAccount[],
): TrueLayerAccount[] {
  const accountMap = new Map<string, TrueLayerAccount>();

  existingAccounts.forEach((account) => {
    accountMap.set(account.account_id, account);
  });

  incomingAccounts.forEach((account) => {
    accountMap.set(account.account_id, account);
  });

  return Array.from(accountMap.values());
}

function getStoredAccounts(): TrueLayerAccount[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = sessionStorage.getItem(CONNECTED_ACCOUNTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as TrueLayerAccount[];
  } catch {
    return [];
  }
}

async function parseJsonSafely(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as { error?: string; accounts?: unknown };
  } catch {
    return { error: "Received invalid response from dashboard API." };
  }
}

function formatMonthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildMonthOptions(monthCount: number) {
  const now = new Date();
  const options: { value: string; label: string }[] = [];

  for (let index = 0; index < monthCount; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const value = formatMonthInputValue(date);
    const label = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label });
  }

  return options;
}

const ConnectedAccounts = ({
  accounts,
  accessToken,
  expiresIn,
  initialError,
}: ConnectedAccountsProps) => {
  const router = useRouter();
  const combinedAccounts = useMemo(
    () => mergeAccounts(getStoredAccounts(), accounts),
    [accounts],
  );
  const monthOptions = useMemo(() => buildMonthOptions(24), []);
  const [incomeAccountIds, setIncomeAccountIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(
    initialError ?? null,
  );
  const [endMonth, setEndMonth] = useState(() =>
    formatMonthInputValue(new Date()),
  );
  const [startMonth, setStartMonth] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return formatMonthInputValue(date);
  });

  useEffect(() => {
    sessionStorage.setItem(
      CONNECTED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(combinedAccounts),
    );
    sessionStorage.setItem(
      CONNECTED_ACCOUNTS_CONTEXT_STORAGE_KEY,
      JSON.stringify({ accessToken, expiresIn }),
    );
  }, [combinedAccounts, accessToken, expiresIn]);

  const handleCheckedChange = (accountId: string, checked: boolean) => {
    setIncomeAccountIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(accountId);
      } else {
        next.delete(accountId);
      }
      return next;
    });
  };

  const handleConnectAnotherAccount = () => {
    sessionStorage.setItem(
      CONNECTED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(combinedAccounts),
    );
    window.location.href = "/api/truelayer/connect";
  };

  const handleStartMonthChange = (nextStartMonth: string) => {
    setStartMonth(nextStartMonth);
    if (nextStartMonth > endMonth) {
      setEndMonth(nextStartMonth);
    }
  };

  const handleEndMonthChange = (nextEndMonth: string) => {
    setEndMonth(nextEndMonth);
    if (nextEndMonth < startMonth) {
      setStartMonth(nextEndMonth);
    }
  };

  const handleBuildDashboard = async () => {
    const selectedIncomeAccountIds = combinedAccounts
      .filter((account) => incomeAccountIds.has(account.account_id))
      .map((account) => account.account_id);

    setDashboardError(null);
    setIsLoadingDashboard(true);

    if (!startMonth || !endMonth) {
      setDashboardError("Select both start and end month.");
      setIsLoadingDashboard(false);
      return;
    }

    if (startMonth > endMonth) {
      setDashboardError("Start month must be before or equal to end month.");
      setIsLoadingDashboard(false);
      return;
    }

    try {
      const response = await fetch("/api/truelayer/dashboard", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          accounts: combinedAccounts,
          incomeAccountIds: selectedIncomeAccountIds,
          startMonth,
          endMonth,
        }),
      });

      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load dashboard data.");
      }

      sessionStorage.setItem(
        "dashboard_accounts",
        JSON.stringify(payload.accounts ?? []),
      );
      sessionStorage.setItem(
        DASHBOARD_DATE_RANGE_STORAGE_KEY,
        JSON.stringify({
          startMonth,
          endMonth,
        }),
      );
      sessionStorage.setItem(
        CONNECTED_ACCOUNTS_STORAGE_KEY,
        JSON.stringify(combinedAccounts),
      );
      router.push("/dashboard");
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Could not load dashboard data.",
      );
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  return (
    <main className={styles.container}>
      <h2 className={styles.title}>Connected Accounts</h2>
      <div>
        <h6 className={styles.subtitle}>Select Income Accounts</h6>
        <p className={styles.description}>
          Money received in the income accounts will be included in your total
          income.
        </p>
      </div>
      <div className={styles.list}>
        {combinedAccounts.map((account) => (
          <AccountCheckboxCard
            key={account.account_id}
            accountType={account.account_type}
            accountNumber={account.account_number}
            currency={account.currency}
            displayName={account.display_name}
            provider={account.provider}
            checked={incomeAccountIds.has(account.account_id)}
            onCheckedChange={(checked) =>
              handleCheckedChange(account.account_id, checked)
            }
          />
        ))}
      </div>

      <div>
        <Button variant="secondary" onClick={handleConnectAnotherAccount}>
          <TrueLayerLogo /> Connect another account
        </Button>
      </div>

      <div className={styles.dateRange}>
        <h6 className={styles.subtitle}>Date Range</h6>
        <div className={styles.dateRangeFields}>
          <label className={styles.dateRangeField}>
            <span className={styles.dateRangeLabelText}>From</span>
            <select
              value={startMonth}
              onChange={(event) => handleStartMonthChange(event.target.value)}
              className={styles.dateRangeFromSelect}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.dateRangeField}>
            <span className={styles.dateRangeLabelText}>To</span>
            <select
              value={endMonth}
              onChange={(event) => handleEndMonthChange(event.target.value)}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {dashboardError ? <small>{dashboardError}</small> : null}

      <div className={styles.dashboardAction}>
        <Button
          size="medium"
          onClick={handleBuildDashboard}
          disabled={isLoadingDashboard || combinedAccounts.length === 0}
        >
          {isLoadingDashboard ? "Processing data..." : "Continue to dashboard"}
        </Button>
      </div>
    </main>
  );
};

export default ConnectedAccounts;
