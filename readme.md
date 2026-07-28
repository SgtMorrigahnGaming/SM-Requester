# SM-Requester

A Twitch plugin that allows viewers to request and queue songs using **Channel Points** or **Bits** (for priority placement). It includes command-line management for both viewers and channel moderators to keep music streaming smooth and controlled.

---

## Features

- **Channel Point & Bit Requests:** Viewers can request songs using Channel Points or jump to the front of the queue using Bits.
- **Real-time Queue Visualization:** Easily see what songs are currently queued and playing.
- **Viewer Controls:** Self-service commands for requesting, skipping, and canceling requests.
- **Moderation Suite:** Comprehensive commands to manage, clear, pause, or ban unwanted songs/artists on the fly.

---

## Commands

### Viewer Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!song` | `!song <song title or link>` | Request a song using Channel Points. |
| `!skip` | `!skip` | Skip your own currently playing song. |
| `!cancel` | `!cancel` | Cancel your request if it hasn't played yet. |

### Moderator Commands

> *Moderators also have access to all viewer commands.*

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!remove` | `!remove <song name or queue ID>` | Remove a specific song from the queue. |
| `!pause` | `!pause` | Pause queue playback. |
| `!start` | `!start` | Start or resume queue playback. |
| `!stop` | `!stop` | Stop the plugin completely. |
| `!clear` | `!clear` | Clear all songs currently in the queue. |
| `!ban` | `!ban <song name or ID>` | Ban a specific song from being requested in the future. |
| `!bband` | `!bband <artist/band name>` | Ban an entire artist or band from being requested. |

---

## Setup & Installation

*(Instructions coming soon as development progresses)*

1. Clone or download this repository.
2. Configure your Twitch API keys and bot credentials.
3. Launch the plugin alongside your broadcast software.

---

## License

*(Add your license choice here, e.g., MIT)*