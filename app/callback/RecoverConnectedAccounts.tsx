"use client";

import ConnectedAccounts from "@/components/ConnectedAccounts";
import ConnectionError from "@/components/ConnectionError";
import type { TrueLayerAccount } from "@/services";

type RecoverConnectedAccountsProps = {
  message: string;
};

type ConnectedAccountsContext = {
  accessToken: string;
  expiresIn: number;
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

function getStoredContext(): ConnectedAccountsContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(CONNECTED_ACCOUNTS_CONTEXT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ConnectedAccountsContext;
    if (!parsed.accessToken || typeof parsed.expiresIn !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const RecoverConnectedAccounts = ({ message }: RecoverConnectedAccountsProps) => {
  const accounts = getStoredAccounts();
  const context = getStoredContext();

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
      accessToken={context.accessToken}
      expiresIn={context.expiresIn}
      initialError={message}
    />
  );
};

export default RecoverConnectedAccounts;
