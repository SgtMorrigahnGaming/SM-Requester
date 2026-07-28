import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const config = {
  port: Number(process.env.PORT ?? 8081),

  twitch: {
    clientId: required("TWITCH_CLIENT_ID"),
    clientSecret: required("TWITCH_CLIENT_SECRET"),
    extensionClientId: required("TWITCH_EXTENSION_CLIENT_ID"),
    extensionSecret: required("TWITCH_EXTENSION_SECRET"),
    eventSubCallbackUrl: process.env.EVENTSUB_CALLBACK_URL ?? "",
    eventSubSecret: process.env.EVENTSUB_SECRET ?? "",
  },

  spotify: {
    clientId: required("SPOTIFY_CLIENT_ID"),
    clientSecret: required("SPOTIFY_CLIENT_SECRET"),
    redirectUri: process.env.SPOTIFY_REDIRECT_URI ?? "http://localhost:8081/auth/spotify/callback",
  },

  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
};
