import { createTrueLayerAuthUrl } from "@/services";
import { NextResponse } from "next/server";

function generateState() {
  return crypto.randomUUID();
}

export async function GET() {
  const state = generateState();
  const authUrl = createTrueLayerAuthUrl({
    state,
  });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("truelayer_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
