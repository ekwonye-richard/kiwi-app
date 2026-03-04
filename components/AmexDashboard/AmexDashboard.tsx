import styles from "./AmexDashboard.module.css";
import { useMemo, useState } from "react";
import type { DashboardAccountData, DashboardDateRange } from "../Dashboard";
import DashboardHeader from "../DashboardHeader";
import Transactions from "../Transactions";
import { AmexLogo } from "@/vectors";

type AmexDashboardProps = {
  accounts: DashboardAccountData[];
  dateRange?: DashboardDateRange | null;
};

const AMEX_REPAYMENT_DESCRIPTION = "PAYMENT RECEIVED - THANK YOU";

const AmexDashboard = ({ accounts, dateRange }: AmexDashboardProps) => {
  const [includeAmexRepayment, setIncludeAmexRepayment] = useState(true);
  const filteredAccounts = useMemo(() => {
    if (includeAmexRepayment) {
      return accounts;
    }

    return accounts.map((account) => ({
      ...account,
      transactions: account.transactions.filter(
        (transaction) => transaction.description !== AMEX_REPAYMENT_DESCRIPTION,
      ),
    }));
  }, [accounts, includeAmexRepayment]);

  return (
    <main className={styles.dashboard}>
      <DashboardHeader
        accounts={accounts}
        dateRange={dateRange}
        logoutHref="/amex"
        exportFilenamePrefix="amex-data"
        showExportButton={false}
        dashboardLogo={<AmexLogo />}
      />
      <section className={styles.transactionsSection}>
        <Transactions
          accounts={filteredAccounts}
          dateRange={dateRange}
          showTransactionTime={false}
          showAccountSelect={false}
          showTotalSuffix={false}
          customFilter={
            <label className={styles.repaymentSwitchField}>
              <span className={styles.repaymentSwitchText}>
                Include Amex repayment
              </span>
              <span className={styles.repaymentSwitchControl}>
                <input
                  type="checkbox"
                  className={styles.repaymentSwitchInput}
                  checked={includeAmexRepayment}
                  onChange={(event) =>
                    setIncludeAmexRepayment(event.target.checked)
                  }
                />
                <span
                  className={styles.repaymentSwitchTrack}
                  aria-hidden="true"
                >
                  <span className={styles.repaymentSwitchThumb} />
                </span>
              </span>
            </label>
          }
        />
      </section>
    </main>
  );
};

export default AmexDashboard;
