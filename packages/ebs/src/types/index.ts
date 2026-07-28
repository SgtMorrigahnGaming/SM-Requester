export type RequestSource = "bits" | "channel_points" | "free" | "streamerbot";

export type QueueEntryStatus = "pending" | "queued" | "played" | "rejected";

export interface QueueEntry {
  id: string;
  broadcasterId: string;
  spotifyTrackUri: string;
  trackName: string;
  artistName: string;
  requestedBy: string;
  source: RequestSource;
  priority: number;
  status: QueueEntryStatus;
  createdAt: string;
}

/** Decoded payload of a Twitch Extension viewer JWT. */
export interface TwitchExtensionViewerToken {
  exp: number;
  opaque_user_id: string;
  user_id?: string;
  channel_id: string;
  role: "viewer" | "broadcaster" | "moderator" | "external";
  pubsub_perms?: { listen?: string[]; send?: string[] };
}
