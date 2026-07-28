import SpotifyWebApi from "spotify-web-api-node";
import { config } from "../config.js";

/**
 * Thin wrapper around spotify-web-api-node.
 *
 * TODO once the Broadcaster model exists: this needs to be per-broadcaster
 * (each broadcaster connects their own Spotify account and we store/refresh
 * their token), not a single shared client. For now this models the calls
 * we'll need against a single client so the API routes have something real
 * to call while the auth/token-storage piece gets built.
 */
export function createSpotifyClient(accessToken: string): SpotifyWebApi {
  const client = new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
    redirectUri: config.spotify.redirectUri,
  });
  client.setAccessToken(accessToken);
  return client;
}

export async function searchTrack(client: SpotifyWebApi, query: string) {
  const result = await client.searchTracks(query, { limit: 5 });
  return (result.body.tracks?.items ?? []).map((track) => ({
    uri: track.uri,
    name: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    durationMs: track.duration_ms,
  }));
}

/**
 * Adds a track to the broadcaster's active Spotify playback queue.
 * Requires: Spotify Premium + an active device on the broadcaster's account.
 */
export async function queueTrack(client: SpotifyWebApi, trackUri: string) {
  await client.addToQueue(trackUri);
}

export async function refreshAccessToken(client: SpotifyWebApi, refreshToken: string) {
  client.setRefreshToken(refreshToken);
  const result = await client.refreshAccessToken();
  return result.body.access_token;
}
