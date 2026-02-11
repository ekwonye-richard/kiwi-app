import "server-only";

type TrueLayerEnvironment = "sandbox" | "live";

type TrueLayerTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

type TrueLayerListResponse<T> = {
  results: T[];
};

export type TrueLayerProvider = {
  provider_id: string;
  display_name: string;
  logo_uri: string;
};

export type TrueLayerAccountAccountNumber = {
  iban?: string;
  sort_code?: string;
  swift_bic?: string;
  number: string;
};

export type TrueLayerAccount = {
  account_id: string;
  account_type: string;
  currency: string;
  display_name: string;
  update_timestamp: string;
  provider?: TrueLayerProvider;
  account_number: TrueLayerAccountAccountNumber;
};

export type TrueLayerCard = {
  account_id: string;
  card_network?: string;
  card_type?: string;
  currency: string;
  display_name: string;
  name_on_card?: string;
  partial_card_number?: string;
  update_timestamp: string;
  provider?: {
    provider_id: string;
    display_name: string;
  };
};

export type TrueLayerTransaction = {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type?: string;
  transaction_category?: string;
  running_balance?: {
    amount: number;
    currency: string;
  };
};

export type TrueLayerBalance = {
  available?: number;
  current?: number;
  overdraft?: number;
  update_timestamp?: string;
  currency?: string;
};

type TrueLayerConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authBaseUrl: string;
  dataBaseUrl: string;
};

const DEFAULT_SCOPES = [
  // "info",
  "accounts",
  "balance",
  // "cards",
  "transactions",
  // "offline_access",
];

function getEnvironment(): TrueLayerEnvironment {
  const env = process.env.TRUELAYER_ENV?.toLowerCase();
  return env === "live" ? "live" : "sandbox";
}

function getBaseUrls(environment: TrueLayerEnvironment) {
  if (environment === "live") {
    return {
      authBaseUrl: "https://auth.truelayer.com",
      dataBaseUrl: "https://api.truelayer.com/data/v1",
    };
  }

  return {
    authBaseUrl: "https://auth.truelayer-sandbox.com",
    dataBaseUrl: "https://api.truelayer-sandbox.com/data/v1",
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getTrueLayerConfig(): TrueLayerConfig {
  const environment = getEnvironment();
  const defaults = getBaseUrls(environment);
  const scopes =
    process.env.TRUELAYER_SCOPES?.split(",")
      .map((scope) => scope.trim())
      .filter(Boolean) ?? DEFAULT_SCOPES;

  return {
    clientId: getRequiredEnv("TRUELAYER_CLIENT_ID"),
    clientSecret: getRequiredEnv("TRUELAYER_CLIENT_SECRET"),
    redirectUri: getRequiredEnv("TRUELAYER_REDIRECT_URI"),
    scopes,
    authBaseUrl: process.env.TRUELAYER_AUTH_BASE_URL ?? defaults.authBaseUrl,
    dataBaseUrl: process.env.TRUELAYER_DATA_BASE_URL ?? defaults.dataBaseUrl,
  };
}

function getEnableMockValue(environment: TrueLayerEnvironment): string {
  if (process.env.TRUELAYER_ENABLE_MOCK) {
    return process.env.TRUELAYER_ENABLE_MOCK;
  }

  return environment === "sandbox" ? "true" : "false";
}

function getDefaultProviders(environment: TrueLayerEnvironment): string {
  if (environment === "sandbox") {
    return "uk-cs-mock";
  }

  return "uk-ob-all uk-oauth-all";
}

async function parseTrueLayerResponse<T>(response: Response): Promise<T> {
  const rawBody = await response.text();
  let body: unknown = null;

  try {
    body = rawBody ? (JSON.parse(rawBody) as unknown) : null;
  } catch {
    body = rawBody;
  }

  if (!response.ok) {
    const parsedErrorMessage =
      typeof body === "object" &&
      body !== null &&
      "error_description" in body &&
      typeof body.error_description === "string"
        ? body.error_description
        : typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
          ? body.error
          : null;

    const fallbackBody =
      typeof body === "string"
        ? body
        : body !== null
          ? JSON.stringify(body)
          : "No response body";

    const errorMessage =
      parsedErrorMessage ??
      `TrueLayer request failed with status ${response.status}: ${fallbackBody}`;

    throw new Error(errorMessage);
  }

  return body as T;
}

export function createTrueLayerAuthUrl({
  state,
  nonce,
}: {
  state: string;
  nonce?: string;
}): string {
  const config = getTrueLayerConfig();
  const environment = getEnvironment();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    providers:
      process.env.TRUELAYER_PROVIDERS ?? getDefaultProviders(environment),
    enable_mock: getEnableMockValue(environment),
    state,
  });

  if (nonce) {
    params.set("nonce", nonce);
  }

  return `${config.authBaseUrl}/?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
): Promise<TrueLayerTokenResponse> {
  const config = getTrueLayerConfig();

  const response = await fetch(`${config.authBaseUrl}/connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
    }),
  });

  return parseTrueLayerResponse<TrueLayerTokenResponse>(response);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TrueLayerTokenResponse> {
  const config = getTrueLayerConfig();

  const response = await fetch(`${config.authBaseUrl}/connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  return parseTrueLayerResponse<TrueLayerTokenResponse>(response);
}

async function trueLayerGet<T>(path: string, accessToken: string): Promise<T> {
  const config = getTrueLayerConfig();
  const response = await fetch(`${config.dataBaseUrl}${path}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseTrueLayerResponse<T>(response);
}

export async function getAccounts(
  accessToken: string,
): Promise<TrueLayerAccount[]> {
  const response = await trueLayerGet<TrueLayerListResponse<TrueLayerAccount>>(
    "/accounts",
    accessToken,
  );

  return response.results;
}

export async function getCards(accessToken: string): Promise<TrueLayerCard[]> {
  const response = await trueLayerGet<TrueLayerListResponse<TrueLayerCard>>(
    "/cards",
    accessToken,
  );

  return response.results;
}

export async function getAccountBalance({
  accessToken,
  accountId,
}: {
  accessToken: string;
  accountId: string;
}): Promise<TrueLayerBalance | null> {
  const response = await trueLayerGet<TrueLayerListResponse<TrueLayerBalance>>(
    `/accounts/${accountId}/balance`,
    accessToken,
  );

  return response.results[0] ?? null;
}

export async function getAccountTransactions({
  accessToken,
  accountId,
  from,
  to,
}: {
  accessToken: string;
  accountId: string;
  from?: string;
  to?: string;
}): Promise<TrueLayerTransaction[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const query = params.toString();
  const path = `/accounts/${accountId}/transactions${query ? `?${query}` : ""}`;

  const response = await trueLayerGet<
    TrueLayerListResponse<TrueLayerTransaction>
  >(path, accessToken);

  return response.results;
}
