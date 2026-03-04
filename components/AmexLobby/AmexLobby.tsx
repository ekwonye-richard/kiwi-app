"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../Button";
import { KiwiLogo } from "@/vectors/KiwiLogo";
import styles from "./AmexLobby.module.css";
import type { DashboardAccountData, DashboardDateRange } from "../Dashboard";
import { AmexLogo } from "@/vectors/AccountLogos";

const DASHBOARD_STORAGE_KEY = "dashboard_accounts";
const DASHBOARD_DATE_RANGE_STORAGE_KEY = "dashboard_date_range";

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        value += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value.trim());
  return values;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findIndex(headers: string[], candidates: string[]): number {
  return headers.findIndex((header) => candidates.includes(header));
}

function parseAmountValue(raw: string): number {
  const cleaned = raw.replace(/[$£€,\s]/g, "");
  if (!cleaned) {
    return 0;
  }

  const normalized =
    cleaned.startsWith("(") && cleaned.endsWith(")")
      ? `-${cleaned.slice(1, -1)}`
      : cleaned;
  return Number(normalized);
}

function parseDate(raw: string): Date | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, yearRaw, monthRaw, dayRaw] = isoMatch;
    return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
  }

  const slashMatch = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (slashMatch) {
    const [, leftRaw, rightRaw, yearRaw] = slashMatch;
    const left = Number(leftRaw);
    const month = Number(rightRaw);
    const year =
      yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);

    // Amex CSVs are UK-formatted: DD/MM/YYYY.
    return new Date(year, month - 1, left);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function parseAmexCsv(rawCsv: string): {
  accounts: DashboardAccountData[];
  dateRange: DashboardDateRange | null;
} {
  const lines = rawCsv
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file has no transaction rows.");
  }

  let headerRowIndex = -1;
  let headers: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const candidate = splitCsvLine(lines[index]).map(normalizeHeader);
    const hasDate =
      findIndex(candidate, ["date", "transactiondate", "posteddate"]) >= 0;
    const hasDescription =
      findIndex(candidate, ["description", "merchant", "details", "memo"]) >= 0;
    const hasAmount =
      findIndex(candidate, ["amount", "transactionamount"]) >= 0 ||
      (findIndex(candidate, ["debit"]) >= 0 &&
        findIndex(candidate, ["credit"]) >= 0);

    if (hasDate && hasDescription && hasAmount) {
      headerRowIndex = index;
      headers = candidate;
      break;
    }
  }

  if (headerRowIndex < 0) {
    throw new Error(
      "Unable to find CSV headers. Expecting Date, Description, and Amount.",
    );
  }

  const dateIndex = findIndex(headers, [
    "date",
    "transactiondate",
    "posteddate",
  ]);
  const descriptionIndex = findIndex(headers, [
    "description",
    "merchant",
    "details",
    "memo",
  ]);
  const amountIndex = findIndex(headers, ["amount", "transactionamount"]);
  const debitIndex = findIndex(headers, ["debit"]);
  const creditIndex = findIndex(headers, ["credit"]);
  const currencyIndex = findIndex(headers, ["currency"]);

  const transactions = lines
    .slice(headerRowIndex + 1)
    .map((line, rowIndex) => {
      const columns = splitCsvLine(line);
      const dateValue = columns[dateIndex] ?? "";
      const descriptionValue = columns[descriptionIndex] ?? "Amex transaction";
      const currencyValue = columns[currencyIndex] ?? "";

      const date = parseDate(dateValue);
      if (!date) {
        return null;
      }

      let amount = Number.NaN;
      if (amountIndex >= 0) {
        amount = parseAmountValue(columns[amountIndex] ?? "");
      } else {
        const debit = parseAmountValue(columns[debitIndex] ?? "");
        const credit = parseAmountValue(columns[creditIndex] ?? "");
        amount = credit - Math.abs(debit);
      }

      if (Number.isNaN(amount) || amount === 0) {
        return null;
      }

      // Amex import convention in this flow is inverted:
      // positive values are expenses and negatives are income.
      const normalizedAmount = -amount;

      return {
        transaction_id: `amex-${date.getTime()}-${rowIndex}`,
        timestamp: date.toISOString(),
        description: descriptionValue || "Amex transaction",
        amount: normalizedAmount,
        currency: currencyValue || "GBP",
      };
    })
    .filter((transaction): transaction is NonNullable<typeof transaction> => {
      return transaction !== null;
    });

  if (transactions.length === 0) {
    throw new Error("No valid transactions were found in the CSV file.");
  }

  transactions.sort((left, right) => {
    return (
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    );
  });

  const currency = transactions[0].currency || "GBP";
  const balance = transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  const months = transactions
    .map((transaction) => transaction.timestamp.slice(0, 7))
    .sort();
  const dateRange =
    months.length > 0
      ? { startMonth: months[0], endMonth: months[months.length - 1] }
      : null;

  return {
    accounts: [
      {
        account: {
          account_id: "amex-import",
          account_type: "credit_card",
          currency,
          display_name: "American Express",
          update_timestamp: new Date().toISOString(),
          provider: {
            provider_id: "amex",
            display_name: "American Express",
            logo_uri: "",
          },
          account_number: {
            number: "AMEX",
          },
        },
        balance: {
          current: balance,
          currency,
        },
        transactions,
        isIncomeAccount: false,
      },
    ],
    dateRange,
  };
}

const AmexLobby = () => {
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.clear();
  }, []);

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
      const parsed = parseAmexCsv(raw);
      sessionStorage.setItem(
        DASHBOARD_STORAGE_KEY,
        JSON.stringify(parsed.accounts),
      );

      if (parsed.dateRange?.startMonth && parsed.dateRange?.endMonth) {
        sessionStorage.setItem(
          DASHBOARD_DATE_RANGE_STORAGE_KEY,
          JSON.stringify(parsed.dateRange),
        );
      } else {
        sessionStorage.removeItem(DASHBOARD_DATE_RANGE_STORAGE_KEY);
      }

      setImportError(null);
      router.push("/amex/dashboard");
    } catch (error) {
      setImportError(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed: invalid CSV file.",
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
        <AmexLogo />
        <div className={styles.dataActions}>
          <Button size="medium" variant="secondary" onClick={handleImportClick}>
            Import CSV
          </Button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,text/csv"
          className={styles.importInput}
          onChange={handleImportData}
        />
        {importError ? <small>{importError}</small> : null}
      </div>
    </main>
  );
};

export default AmexLobby;
