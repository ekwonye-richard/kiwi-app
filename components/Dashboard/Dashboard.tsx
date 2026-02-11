import {
  type TrueLayerAccount,
  type TrueLayerBalance,
  type TrueLayerTransaction,
} from "@/services";
import styles from "./Dashboard.module.css";
import { KiwiLogo } from "@/vectors/KiwiLogo";
import Card from "../Card";
import classNames from "classnames";
import Button from "../Button";
import AccountLogosList from "../AccountLogoList";
import Transactions from "../Transactions";

export type DashboardAccountData = {
  account: TrueLayerAccount;
  balance: TrueLayerBalance | null;
  transactions: TrueLayerTransaction[];
  isIncomeAccount: boolean;
};

export type DashboardDateRange = {
  startMonth: string;
  endMonth: string;
};

export type DashboardExportData = {
  accounts: DashboardAccountData[];
  dateRange: DashboardDateRange | null;
};

type DashboardProps = {
  accounts: DashboardAccountData[];
  dateRange?: DashboardDateRange | null;
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getBalanceValue(accountData: DashboardAccountData) {
  return accountData.balance?.current ?? accountData.balance?.available ?? 0;
}

function getPositiveTotalsByCurrency(
  entries: Map<string, number>,
): Array<[string, number]> {
  return Array.from(entries.entries()).filter(([, amount]) => amount > 0);
}

const Dashboard = ({ accounts, dateRange }: DashboardProps) => {
  const formatMonthLabel = (monthValue: string) => {
    const [year, month] = monthValue.split("-");
    const yearNumber = Number(year);
    const monthNumber = Number(month);

    if (
      Number.isNaN(yearNumber) ||
      Number.isNaN(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return monthValue;
    }

    return new Date(yearNumber, monthNumber - 1, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const dateRangeLabel =
    dateRange && dateRange.startMonth && dateRange.endMonth
      ? `${formatMonthLabel(dateRange.startMonth)} to ${formatMonthLabel(
          dateRange.endMonth,
        )}`
      : null;

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
    anchor.download = `kiwi-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };

  const balanceAccounts = accounts.filter((accountData) => {
    return getBalanceValue(accountData) > 0;
  });

  const expenseAccounts = accounts.filter((accountData) =>
    accountData.transactions.some((transaction) => transaction.amount < 0),
  );

  const incomeAccounts = accounts.filter((accountData) => {
    if (!accountData.isIncomeAccount) {
      return false;
    }

    return accountData.transactions.some(
      (transaction) => transaction.amount > 0,
    );
  });

  const balanceTotalsByCurrency = new Map<string, number>();
  balanceAccounts.forEach((accountData) => {
    const currency =
      accountData.balance?.currency ?? accountData.account.currency;
    const currentTotal = balanceTotalsByCurrency.get(currency) ?? 0;
    balanceTotalsByCurrency.set(
      currency,
      currentTotal + getBalanceValue(accountData),
    );
  });

  const incomeTotalsByCurrency = new Map<string, number>();
  incomeAccounts.forEach((accountData) => {
    accountData.transactions.forEach((transaction) => {
      if (transaction.amount <= 0) {
        return;
      }

      const currency = transaction.currency || accountData.account.currency;
      const currentTotal = incomeTotalsByCurrency.get(currency) ?? 0;
      incomeTotalsByCurrency.set(currency, currentTotal + transaction.amount);
    });
  });

  const expenseTotalsByCurrency = new Map<string, number>();
  expenseAccounts.forEach((accountData) => {
    accountData.transactions.forEach((transaction) => {
      if (transaction.amount >= 0) {
        return;
      }

      const currency = transaction.currency || accountData.account.currency;
      const currentTotal = expenseTotalsByCurrency.get(currency) ?? 0;
      expenseTotalsByCurrency.set(
        currency,
        currentTotal + Math.abs(transaction.amount),
      );
    });
  });

  const positiveBalanceTotals = getPositiveTotalsByCurrency(
    balanceTotalsByCurrency,
  );
  const positiveIncomeTotals = getPositiveTotalsByCurrency(
    incomeTotalsByCurrency,
  );
  const positiveExpenseTotals = getPositiveTotalsByCurrency(
    expenseTotalsByCurrency,
  );

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <span className={styles.kiwiLogo}>
          <KiwiLogo />
        </span>
        <div className={styles.headerActions}>
          <Button onClick={handleExportData}>Export data</Button>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {dateRangeLabel ? (
        <div className={styles.dateRangeLabel}>{dateRangeLabel}</div>
      ) : null}

      <section className={styles.accountsPrimaryData}>
        <Card
          title="Total Balance"
          className={styles.cardTotalBalance}
          footer={
            <AccountLogosList
              providers={balanceAccounts.map(
                (account) => account.account.provider,
              )}
            />
          }
        >
          {positiveBalanceTotals.length === 0 ? (
            <div>
              <span className={styles.amountLarge}>
                {formatCurrency(0, "GBP")}
              </span>
            </div>
          ) : (
            positiveBalanceTotals.map(([currency, totalBalance], index) => (
              <div key={currency}>
                <div>
                  {index > 0 && (
                    <span className={styles.amountDivider}> / </span>
                  )}
                  <span
                    className={classNames({
                      [styles.amountLarge]: index === 0,
                      [styles.amountRegular]: index > 0,
                    })}
                  >
                    {formatCurrency(totalBalance, currency)}
                  </span>
                </div>
              </div>
            ))
          )}
        </Card>
        <Card
          className={styles.cardTotalIncome}
          title="Total Income"
          footer={
            <AccountLogosList
              providers={incomeAccounts.map(
                (account) => account.account.provider,
              )}
            />
          }
        >
          {positiveIncomeTotals.length === 0 ? (
            <div>
              <span className={styles.amountMedium}>
                {formatCurrency(0, "GBP")}
              </span>
            </div>
          ) : (
            positiveIncomeTotals.map(([currency, totalIncome], index) => (
              <div key={currency}>
                <div>
                  {index > 0 && (
                    <span className={styles.amountDivider}> / </span>
                  )}
                  <span
                    className={classNames({
                      [styles.amountMedium]: index === 0,
                      [styles.amountRegular]: index > 0,
                    })}
                  >
                    {formatCurrency(totalIncome, currency)}
                  </span>
                </div>
              </div>
            ))
          )}
          <small className={styles.cardNote}>
            Aggregated from income accounts
          </small>
        </Card>
        <Card
          title="Total Expenses"
          className={styles.cardExpenses}
          footer={
            <AccountLogosList
              providers={expenseAccounts.map(
                (account) => account.account.provider,
              )}
            />
          }
        >
          {positiveExpenseTotals.length === 0 ? (
            <div>
              <span className={styles.amountMedium}>
                {formatCurrency(0, "GBP")}
              </span>
            </div>
          ) : (
            positiveExpenseTotals.map(([currency, totalExpenses], index) => (
              <div key={currency}>
                <div>
                  {index > 0 && (
                    <span className={styles.amountDivider}> / </span>
                  )}
                  <span
                    className={classNames({
                      [styles.amountMedium]: index === 0,
                      [styles.amountRegular]: index > 0,
                    })}
                  >
                    {formatCurrency(totalExpenses, currency)}
                  </span>
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      <section className={styles.transactionsSection}>
        <Transactions accounts={accounts} dateRange={dateRange} />
      </section>
    </main>
  );
};

export default Dashboard;
