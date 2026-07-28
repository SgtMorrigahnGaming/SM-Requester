import { useEffect, useState } from "react";
import { onAuthorized, onTransactionComplete, useBits } from "./twitch/twitchExtension";
import { QueueList } from "./components/QueueList";
import { RequestForm } from "./components/RequestForm";

// TODO: move to an env-driven config once we have real deploy targets.
// https is required once this panel is embedded in Twitch's HTTPS page —
// see the mixed-content note in packages/ebs/src/index.ts.
const EBS_BASE_URL = "https://localhost:8081";

interface QueueEntry {
  id: string;
  trackName: string;
  artistName: string;
  requestedBy: string;
  source: "bits" | "channel_points" | "free" | "streamerbot";
  status: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [pendingPriorityQuery, setPendingPriorityQuery] = useState<string | null>(null);

  useEffect(() => {
    onAuthorized((auth) => setToken(auth.token));
    onTransactionComplete((receipt) => {
      if (!pendingPriorityQuery || !token) return;
      // TODO: replace the placeholder track fields with a real search result
      // once /search exists — right now this just demonstrates the flow.
      void fetch(`${EBS_BASE_URL}/api/viewer/requests/priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          spotifyTrackUri: "spotify:track:placeholder",
          trackName: pendingPriorityQuery,
          artistName: "Unknown",
          transactionReceipt: receipt,
        }),
      }).then(fetchQueue);
      setPendingPriorityQuery(null);
    });
  }, [token, pendingPriorityQuery]);

  async function fetchQueue() {
    if (!token) return;
    const res = await fetch(`${EBS_BASE_URL}/api/viewer/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue);
    }
  }

  useEffect(() => {
    if (token) void fetchQueue();
  }, [token]);

  async function submitFree(query: string) {
    if (!token) return;
    await fetch(`${EBS_BASE_URL}/api/viewer/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        spotifyTrackUri: "spotify:track:placeholder",
        trackName: query,
        artistName: "Unknown",
      }),
    });
    void fetchQueue();
  }

  function submitPriority(query: string) {
    setPendingPriorityQuery(query);
    // TODO: SKU comes from products configured in the dev console's Bits tab.
    useBits("priority_request");
  }

  return (
    <div className="panel">
      <h1>Song Requests</h1>
      <RequestForm onSubmitFree={submitFree} onSubmitPriority={submitPriority} />
      <QueueList entries={queue} />
    </div>
  );
}
