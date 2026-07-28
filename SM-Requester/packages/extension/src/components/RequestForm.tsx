import { useState } from "react";

interface Props {
  onSubmitFree: (query: string) => void;
  onSubmitPriority: (query: string) => void;
}

// TODO: replace the free-text query with a real Spotify search-as-you-type
// once the EBS exposes a /search endpoint (proxying Spotify's search API —
// the panel itself must never hold a Spotify token).
export function RequestForm({ onSubmitFree, onSubmitPriority }: Props) {
  const [query, setQuery] = useState("");

  return (
    <form
      className="request-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (query.trim()) onSubmitFree(query.trim());
      }}
    >
      <input
        type="text"
        placeholder="Search for a song..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Request</button>
      <button
        type="button"
        className="request-form__priority"
        onClick={() => query.trim() && onSubmitPriority(query.trim())}
      >
        Request with Bits ⭐
      </button>
    </form>
  );
}
