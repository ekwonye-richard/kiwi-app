import { useMemo, useState } from "react";
import type { DashboardAccountData, DashboardDateRange } from "../Dashboard";
import DayTransactions from "../DayTransactions";
import { type TransactionItem } from "../Transaction";
import styles from "./Transactions.module.css";
import MonthRangeSelect, { type MonthOption } from "../MonthRangeSelect";

type TransactionsProps = {
  accounts: DashboardAccountData[];
  dateRange?: DashboardDateRange | null;
};

type DayGroup = {
  key: string;
  label: string;
  items: TransactionItem[];
};

function toLocalDateKey(timestamp: string) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalMonthKey(timestamp: string) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildBoundedMonthOptions(
  startMonth: string,
  endMonth: string,
): MonthOption[] {
  if (!startMonth || !endMonth || startMonth > endMonth) {
    return [];
  }

  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const [endYear, endMonthNumber] = endMonth.split("-").map(Number);
  const startDate = new Date(startYear, startMonthNumber - 1, 1);
  const endDate = new Date(endYear, endMonthNumber - 1, 1);
  const options: MonthOption[] = [];

  while (endDate.getTime() >= startDate.getTime()) {
    const value = `${endDate.getFullYear()}-${String(
      endDate.getMonth() + 1,
    ).padStart(2, "0")}`;
    options.push({
      value,
      label: endDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    });
    endDate.setMonth(endDate.getMonth() - 1);
  }

  return options;
}

function getDefaultRange(
  accounts: DashboardAccountData[],
  dateRange?: DashboardDateRange | null,
) {
  if (dateRange?.startMonth && dateRange?.endMonth) {
    return {
      startMonth: dateRange.startMonth,
      endMonth: dateRange.endMonth,
    };
  }

  const allMonths = accounts.flatMap((account) =>
    account.transactions.map((transaction) =>
      toLocalMonthKey(transaction.timestamp),
    ),
  );

  if (allMonths.length === 0) {
    const now = new Date();
    const fallback = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;
    return { startMonth: fallback, endMonth: fallback };
  }

  const sorted = [...allMonths].sort();
  return {
    startMonth: sorted[0],
    endMonth: sorted[sorted.length - 1],
  };
}

function formatGroupLabel(dateKey: string) {
  const now = new Date();
  const todayKey = toLocalDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday.toISOString());

  if (dateKey === todayKey) {
    return "Today";
  }

  if (dateKey === yesterdayKey) {
    return "Yesterday";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildDayGroups({ items }: { items: TransactionItem[] }): DayGroup[] {
  const groups = new Map<string, TransactionItem[]>();
  items.forEach((item) => {
    const key = toLocalDateKey(item.timestamp);
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  });

  return Array.from(groups.entries()).map(([key, dayItems]) => ({
    key,
    label: formatGroupLabel(key),
    items: dayItems,
  }));
}

function buildFilteredTransactions({
  accounts,
  fromMonth,
  toMonth,
}: {
  accounts: DashboardAccountData[];
  fromMonth: string;
  toMonth: string;
}): TransactionItem[] {
  const flattened: TransactionItem[] = accounts.flatMap((accountData) =>
    accountData.transactions.map((transaction) => ({
      id: `${accountData.account.account_id}-${transaction.transaction_id}`,
      timestamp: transaction.timestamp,
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency || accountData.account.currency,
      accountNumber: accountData.account.account_number,
      provider: accountData.account.provider,
    })),
  );

  const filteredItems = flattened.filter((item) => {
    const monthKey = toLocalMonthKey(item.timestamp);
    return monthKey >= fromMonth && monthKey <= toMonth;
  });

  filteredItems.sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );

  return filteredItems;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getAccountLabel(account: DashboardAccountData["account"]) {
  const accountNumber =
    account.account_number.number ||
    account.account_number.swift_bic ||
    account.account_number.iban ||
    "****";

  return `${account.display_name} (${accountNumber})`;
}

const Transactions = ({ accounts, dateRange }: TransactionsProps) => {
  const defaultRange = useMemo(
    () => getDefaultRange(accounts, dateRange),
    [accounts, dateRange],
  );
  const monthOptions = useMemo(
    () =>
      buildBoundedMonthOptions(defaultRange.startMonth, defaultRange.endMonth),
    [defaultRange.startMonth, defaultRange.endMonth],
  );
  const [fromMonth, setFromMonth] = useState(defaultRange.startMonth);
  const [toMonth, setToMonth] = useState(defaultRange.endMonth);
  const [searchValue, setSearchValue] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("*");
  const accountOptions = useMemo(
    () =>
      accounts.map((accountData) => ({
        value: accountData.account.account_id,
        label: getAccountLabel(accountData.account),
      })),
    [accounts],
  );
  const filteredAccounts = useMemo(
    () =>
      selectedAccountId === "*"
        ? accounts
        : accounts.filter(
            (accountData) =>
              accountData.account.account_id === selectedAccountId,
          ),
    [accounts, selectedAccountId],
  );

  const monthFilteredItems = useMemo(
    () =>
      buildFilteredTransactions({
        accounts: filteredAccounts,
        fromMonth,
        toMonth,
      }),
    [filteredAccounts, fromMonth, toMonth],
  );
  const searchTerms = useMemo(
    () =>
      searchValue
        .split(",")
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean),
    [searchValue],
  );
  const filteredItems = useMemo(() => {
    if (searchTerms.length === 0) {
      return monthFilteredItems;
    }

    return monthFilteredItems.filter((item) => {
      const accountNumber =
        item.accountNumber.number ||
        item.accountNumber.swift_bic ||
        item.accountNumber.iban ||
        "";
      const searchableText = [
        item.description,
        item.currency,
        item.provider?.display_name,
        accountNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTerms.some((term) => searchableText.includes(term));
    });
  }, [monthFilteredItems, searchTerms]);
  const groups = useMemo(
    () =>
      buildDayGroups({
        items: filteredItems,
      }),
    [filteredItems],
  );
  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, { income: number; expenses: number }>();

    filteredItems.forEach((item) => {
      const current = totals.get(item.currency) ?? { income: 0, expenses: 0 };
      if (item.amount > 0) {
        current.income += item.amount;
      } else if (item.amount < 0) {
        current.expenses += Math.abs(item.amount);
      }
      totals.set(item.currency, current);
    });

    return Array.from(totals.entries());
  }, [filteredItems]);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h3 className={styles.title}>Transactions</h3>
        <div className={styles.controlsRow}>
          <div className={styles.filterInputs}>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className={styles.searchInput}
              placeholder="Search"
            />
            <label className={styles.accountField}>
              <span className={styles.accountLabelText}>Accounts</span>
              <select
                value={selectedAccountId}
                onChange={(event) => setSelectedAccountId(event.target.value)}
                className={styles.accountSelect}
              >
                <option value="*">All</option>
                {accountOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <MonthRangeSelect
            fromMonth={fromMonth}
            toMonth={toMonth}
            options={monthOptions}
            onRangeChange={({
              fromMonth: nextFromMonth,
              toMonth: nextToMonth,
            }) => {
              setFromMonth(nextFromMonth);
              setToMonth(nextToMonth);
            }}
          />
        </div>
        <div className={styles.totalsRow}>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>
              Total Income (all accounts)
            </span>
            <span className={styles.totalValue}>
              {totalsByCurrency.length === 0
                ? formatCurrency(0, "GBP")
                : totalsByCurrency.map(([currency, totals], index) => (
                    <span key={`income-${currency}`}>
                      {index > 0 ? (
                        <span className={styles.amountDivider}> / </span>
                      ) : null}
                      {formatCurrency(totals.income, currency)}
                    </span>
                  ))}
            </span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>
              Total Expenses (all accounts)
            </span>
            <span className={styles.totalValue}>
              {totalsByCurrency.length === 0
                ? formatCurrency(0, "GBP")
                : totalsByCurrency.map(([currency, totals], index) => (
                    <span key={`expenses-${currency}`}>
                      {index > 0 ? (
                        <span className={styles.amountDivider}> / </span>
                      ) : null}
                      {formatCurrency(totals.expenses, currency)}
                    </span>
                  ))}
            </span>
          </div>
        </div>
      </header>
      {groups.length === 0 ? (
        <p className={styles.empty}>No transactions for this period.</p>
      ) : (
        <div className={styles.groups}>
          {groups.map((group, index) => (
            <DayTransactions
              key={group.key}
              label={group.label}
              items={group.items}
              isLastGroup={index === groups.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Transactions;
