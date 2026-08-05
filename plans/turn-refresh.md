# Twilio TURN credential refresh (Stream Mode)

`twilioturnservercurl.md` was gitignored and is not in the repo. Use this instead.

Hardcoded creds live in `client/src/hooks/useWebRTC.js` → `turnCredentials` (`username`, `credential`, `lastResetTimestamp`). They expire ~24h. `ServerStatusTimer` shows the countdown from `lastResetTimestamp`.

## Refresh

```bash
# Needs your Twilio Account SID + Auth Token (from Twilio Console)
curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Tokens.json" \
  -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}"
```

From the JSON response, copy:
- `username` → `turnCredentials.username`
- `password` → `turnCredentials.credential`
- Set `lastResetTimestamp` to now, e.g. `"2026-08-05 17:00"` (local time is fine; same format as existing)

Do **not** change the `global.turn.twilio.com` / `global.stun.twilio.com` URLs.

Vite hot-reloads the client after you save `useWebRTC.js`. No server restart needed for TURN-only edits.

## Check expiry without guessing

On the landing page, look at **Streaming Mode Available For:** — if it says expired / red, refresh creds before testing Stream Mode. Sync Mode does not need TURN.
