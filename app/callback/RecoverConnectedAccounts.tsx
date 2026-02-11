"use client";

import ConnectedAccounts from "@/components/ConnectedAccounts";
import ConnectionError from "@/components/ConnectionError";
import type { TrueLayerAccount } from "@/services";
import type { AccountAccessContext } from "@/components/ConnectedAccounts/ConnectedAccounts";

type RecoverConnectedAccountsProps = {
  message: string;
};

type ConnectedAccountsContext = {
  accountContexts: AccountAccessContext[];
};

const CONNECTED_ACCOUNTS_STORAGE_KEY = "connected_accounts";
const CONNECTED_ACCOUNTS_CONTEXT_STORAGE_KEY = "connected_accounts_context";

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

function getStoredContext(
  accounts: TrueLayerAccount[],
): ConnectedAccountsContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(CONNECTED_ACCOUNTS_CONTEXT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ConnectedAccountsContext;
    if (!Array.isArray(parsed.accountContexts)) {
      return null;
    }

    const accountContexts = parsed.accountContexts.filter((context) => {
      return (
        typeof context?.accountId === "string" &&
        typeof context?.accessToken === "string" &&
        typeof context?.expiresIn === "number"
      );
    });

    if (accountContexts.length === 0) {
      return null;
    }

    return { accountContexts };
  } catch {
    try {
      // Backward compatibility for old stored shape:
      // { accessToken, expiresIn }
      const parsed = JSON.parse(raw) as {
        accessToken?: string;
        expiresIn?: number;
      };
      if (!parsed.accessToken || typeof parsed.expiresIn !== "number") {
        return null;
      }

      return {
        accountContexts: accounts.map((account) => ({
          accountId: account.account_id,
          accessToken: parsed.accessToken as string,
          expiresIn: parsed.expiresIn as number,
        })),
      };
    } catch {
      return null;
    }
  }
}

const RecoverConnectedAccounts = ({ message }: RecoverConnectedAccountsProps) => {
  const accounts = getStoredAccounts();
  const context = getStoredContext(accounts);

  if (accounts.length === 0 || !context) {
    return (
      <main>
        <ConnectionError message={message} />
      </main>
    );
  }

  return (
    <ConnectedAccounts
      accounts={accounts}
      initialError={message}
    />
  );
};

export default RecoverConnectedAccounts;
