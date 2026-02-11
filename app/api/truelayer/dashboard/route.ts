import {
  getAccountBalance,
  getAccountTransactions,
  type TrueLayerAccount,
  type TrueLayerBalance,
  type TrueLayerTransaction,
} from "@/services";
import { NextResponse } from "next/server";

type DashboardAccountData = {
  account: TrueLayerAccount;
  balance: TrueLayerBalance | null;
  transactions: TrueLayerTransaction[];
  isIncomeAccount: boolean;
  fetchError?: string;
};

type RequestBody = {
  accessToken?: string;
  accounts?: TrueLayerAccount[];
  incomeAccountIds?: string[];
  startMonth?: string;
  endMonth?: string;
};

function parseMonthRange({
  startMonth,
  endMonth,
}: {
  startMonth?: string;
  endMonth?: string;
}): { from: string; to: string } | null {
  if (!startMonth || !endMonth) {
    return null;
  }

  const startParts = startMonth.split("-");
  const endParts = endMonth.split("-");

  if (startParts.length !== 2 || endParts.length !== 2) {
    return null;
  }

  const startYear = Number(startParts[0]);
  const startMonthIndex = Number(startParts[1]) - 1;
  const endYear = Number(endParts[0]);
  const endMonthIndex = Number(endParts[1]) - 1;

  if (
    Number.isNaN(startYear) ||
    Number.isNaN(startMonthIndex) ||
    Number.isNaN(endYear) ||
    Number.isNaN(endMonthIndex) ||
    startMonthIndex < 0 ||
    startMonthIndex > 11 ||
    endMonthIndex < 0 ||
    endMonthIndex > 11
  ) {
    return null;
  }

  const fromDate = new Date(Date.UTC(startYear, startMonthIndex, 1, 0, 0, 0));
  const toDate = new Date(
    Date.UTC(endYear, endMonthIndex + 1, 0, 23, 59, 59, 999),
  );

  if (fromDate.getTime() > toDate.getTime()) {
    return null;
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const accessToken = body.accessToken?.trim();
    const incomeAccountIds = body.incomeAccountIds ?? [];
    const accounts = body.accounts ?? [];

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token." },
        { status: 400 },
      );
    }

    const range = parseMonthRange({
      startMonth: body.startMonth,
      endMonth: body.endMonth,
    });

    if (!range) {
      return NextResponse.json(
        {
          error:
            "Invalid date range. Please provide a valid start and end month.",
        },
        { status: 400 },
      );
    }

    const dashboardAccounts: DashboardAccountData[] = await Promise.all(
      accounts.map(async (account) => {
        const [balanceResult, transactionsResult] = await Promise.allSettled([
          getAccountBalance({
            accessToken,
            accountId: account.account_id,
          }),
          getAccountTransactions({
            accessToken,
            accountId: account.account_id,
            from: range.from,
            to: range.to,
          }),
        ]);

        const fetchErrorMessages: string[] = [];
        const balance =
          balanceResult.status === "fulfilled" ? balanceResult.value : null;
        if (balanceResult.status === "rejected") {
          fetchErrorMessages.push("balance");
        }

        const transactions =
          transactionsResult.status === "fulfilled"
            ? transactionsResult.value
            : [];
        if (transactionsResult.status === "rejected") {
          fetchErrorMessages.push("transactions");
        }

        return {
          account,
          balance,
          transactions,
          isIncomeAccount: incomeAccountIds.includes(account.account_id),
          fetchError:
            fetchErrorMessages.length > 0
              ? `Could not fetch ${fetchErrorMessages.join(" & ")}`
              : undefined,
        };
      }),
    );

    return NextResponse.json({ accounts: dashboardAccounts });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard account data.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
