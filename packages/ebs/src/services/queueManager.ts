import { randomUUID } from "node:crypto";
import type { QueueEntry, RequestSource } from "../types/index.js";

/**
 * In-memory queue store to get things running end-to-end during development.
 * TODO: swap for a real persistence layer (Prisma + SQLite is the plan — see
 * ARCHITECTURE.md) once the request/response shapes here are settled. Keeping
 * this behind a small interface-like set of functions makes that swap
 * mechanical rather than a rewrite.
 */
const queues = new Map<string, QueueEntry[]>();

function getQueue(broadcasterId: string): QueueEntry[] {
  if (!queues.has(broadcasterId)) {
    queues.set(broadcasterId, []);
  }
  return queues.get(broadcasterId)!;
}

export interface AddRequestInput {
  broadcasterId: string;
  spotifyTrackUri: string;
  trackName: string;
  artistName: string;
  requestedBy: string;
  source: RequestSource;
  /** Higher priority plays sooner. Bits/channel-points requests should pass >0. */
  priority?: number;
}

export function addRequest(input: AddRequestInput): QueueEntry {
  const entry: QueueEntry = {
    id: randomUUID(),
    broadcasterId: input.broadcasterId,
    spotifyTrackUri: input.spotifyTrackUri,
    trackName: input.trackName,
    artistName: input.artistName,
    requestedBy: input.requestedBy,
    source: input.source,
    priority: input.priority ?? 0,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const queue = getQueue(input.broadcasterId);
  queue.push(entry);
  // Highest priority first; ties broken by submission order.
  queue.sort((a, b) => b.priority - a.priority);

  return entry;
}

export function listQueue(broadcasterId: string): QueueEntry[] {
  return getQueue(broadcasterId);
}

export function markStatus(
  broadcasterId: string,
  entryId: string,
  status: QueueEntry["status"],
): QueueEntry | undefined {
  const entry = getQueue(broadcasterId).find((e) => e.id === entryId);
  if (entry) entry.status = status;
  return entry;
}

export function removeEntry(broadcasterId: string, entryId: string): boolean {
  const queue = getQueue(broadcasterId);
  const index = queue.findIndex((e) => e.id === entryId);
  if (index === -1) return false;
  queue.splice(index, 1);
  return true;
}
