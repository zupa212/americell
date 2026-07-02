// Remote-control provider abstraction.
//
// This is the ONLY place that talks to the device-control backend. Swap the body
// of `requestUnlockSession` to integrate a real provider. Provider credentials are
// read from server-only env vars and never reach the client.

const PROVIDER_URL = process.env.REMOTE_PROVIDER_URL;
const PROVIDER_KEY = process.env.REMOTE_PROVIDER_API_KEY;

export const isProviderConfigured = Boolean(PROVIDER_URL && PROVIDER_KEY);

export type UnlockResult =
  | { ok: true; sessionUrl: string }
  | { ok: false; configured: false; message: string };

export async function requestUnlockSession(
  deviceId: string,
  userId: string,
): Promise<UnlockResult> {
  if (!PROVIDER_URL || !PROVIDER_KEY) {
    return {
      ok: false,
      configured: false,
      message: "Remote provider not configured yet.",
    };
  }

  const res = await fetch(`${PROVIDER_URL.replace(/\/$/, "")}/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${PROVIDER_KEY}`,
    },
    body: JSON.stringify({ deviceId, userId }),
  });

  if (!res.ok) {
    throw new Error(`Remote provider returned ${res.status}`);
  }

  const data = (await res.json()) as { sessionUrl?: string; url?: string };
  return { ok: true, sessionUrl: data.sessionUrl ?? data.url ?? "" };
}
