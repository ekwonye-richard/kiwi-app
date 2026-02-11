import CallbackShell from "./CallbackShell";
import RecoverConnectedAccounts from "./RecoverConnectedAccounts";
import ConnectedAccounts from "@/components/ConnectedAccounts";
import {
  exchangeCodeForToken,
  getAccounts,
  type TrueLayerAccount,
} from "@/services";
import { cookies } from "next/headers";

type CallbackPageProps = {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
    state?: string;
  }>;
};

function renderError(message: string) {
  return (
    <CallbackShell>
      <RecoverConnectedAccounts message={message} />
    </CallbackShell>
  );
}

export default async function CallbackPage({
  searchParams,
}: CallbackPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("truelayer_oauth_state")?.value;

  if (params.error) {
    return renderError(params.error_description ?? params.error);
  }

  if (!params.code) {
    // return renderError("Missing authorization code in callback URL.");
    return renderError("");
  }

  if (!params.state || !expectedState || params.state !== expectedState) {
    return renderError("Invalid OAuth state. Please try connecting again.");
  }

  let expiresIn: number;
  let accessToken: string;
  let accounts: TrueLayerAccount[] = [];

  try {
    const tokenResponse = await exchangeCodeForToken(params.code);
    accessToken = tokenResponse.access_token;
    expiresIn = tokenResponse.expires_in;
    accounts = await getAccounts(accessToken);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Token exchange failed unexpectedly.";
    console.log("TrueLayer callback error:", error);

    return renderError(message);
  }

  return (
    <CallbackShell>
      <ConnectedAccounts
        accounts={accounts}
        accessToken={accessToken}
        expiresIn={expiresIn}
      />
    </CallbackShell>
  );
}
