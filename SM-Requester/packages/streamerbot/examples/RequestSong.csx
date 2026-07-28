// Example "Execute C# Code" sub-action for Streamer.bot.
// Wire this to a Channel Points redemption or `!sr <song>` command trigger.
//
// Streamer.bot exposes `CPH` (the Client-Python-Host-style helper object) with
// access to the trigger's arguments, e.g. CPH.TryGetArg("rawInput", out string song)
// for a chat command, or CPH.TryGetArg("redemption.userInput", out string song)
// for a Channel Points redemption with user input enabled.
//
// This is a starting point — swap in the actual arg names for whatever trigger
// you wire it to (check Streamer.bot's Argument list in the action editor).

using System.Net.Http;
using System.Text;

public class CPHInline
{
    private static readonly HttpClient httpClient = new HttpClient();
    private const string EbsBaseUrl = "http://localhost:8081";
    private const string StreamerBotKey = "dev-local-key"; // TODO: pull from Streamer.bot's global vars instead of hardcoding

    public bool Execute()
    {
        CPH.TryGetArg("user", out string requestedBy);
        CPH.TryGetArg("rawInput", out string song);
        CPH.TryGetArg("broadcastUserId", out string broadcasterId);

        if (string.IsNullOrWhiteSpace(song))
        {
            CPH.SendMessage("Usage: !sr <song name>");
            return false;
        }

        var payload = new
        {
            broadcasterId = broadcasterId,
            // TODO: this should come from a Spotify search done EBS-side
            // (add a GET /api/streamerbot/search?q=... route) rather than
            // guessing a track URI here.
            spotifyTrackUri = "spotify:track:placeholder",
            trackName = song,
            artistName = "Unknown",
            requestedBy = requestedBy,
            priority = 0
        };

        var json = System.Text.Json.JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var request = new HttpRequestMessage(HttpMethod.Post, $"{EbsBaseUrl}/api/streamerbot/requests")
        {
            Content = content
        };
        request.Headers.Add("X-StreamerBot-Key", StreamerBotKey);

        var response = httpClient.Send(request);

        if (response.IsSuccessStatusCode)
        {
            CPH.SendMessage($"@{requestedBy} queued: {song}");
        }
        else
        {
            CPH.SendMessage($"@{requestedBy} sorry, couldn't queue that one.");
        }

        return true;
    }
}
