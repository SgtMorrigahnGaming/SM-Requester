interface QueueEntry {
  id: string;
  trackName: string;
  artistName: string;
  requestedBy: string;
  source: "bits" | "channel_points" | "free" | "streamerbot";
  status: string;
}

export function QueueList({ entries }: { entries: QueueEntry[] }) {
  if (entries.length === 0) {
    return <p className="empty">No songs queued yet — be the first to request one!</p>;
  }

  return (
    <ul className="queue-list">
      {entries.map((entry) => (
        <li key={entry.id} className={`queue-entry queue-entry--${entry.source}`}>
          <span className="queue-entry__track">{entry.trackName}</span>
          <span className="queue-entry__artist">{entry.artistName}</span>
          <span className="queue-entry__requester">req. by {entry.requestedBy}</span>
          {entry.source === "bits" && <span className="queue-entry__badge">⭐ priority</span>}
        </li>
      ))}
    </ul>
  );
}
