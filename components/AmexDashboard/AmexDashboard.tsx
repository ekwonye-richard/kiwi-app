import styles from "./AmexDashboard.module.css";
import type { DashboardAccountData, DashboardDateRange } from "../Dashboard";
import DashboardHeader from "../DashboardHeader";
import Transactions from "../Transactions";
import { AmexLogo } from "@/vectors";

type AmexDashboardProps = {
  accounts: DashboardAccountData[];
  dateRange?: DashboardDateRange | null;
};

const AmexDashboard = ({ accounts, dateRange }: AmexDashboardProps) => {
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
          accounts={accounts}
          dateRange={dateRange}
          showTransactionTime={false}
          showAccountSelect={false}
          showTotalSuffix={false}
        />
      </section>
    </main>
  );
};

export default AmexDashboard;
