# Twilio TURN credential refresh (Stream Mode)

Hardcoded creds live in `client/src/hooks/useWebRTC.js` → `turnCredentials` (`username`, `credential`, `lastResetTimestamp`). They expire ~24h. `ServerStatusTimer` shows the countdown from `lastResetTimestamp`.

## Preferred: run the updater script

```bash
bash /Users/rajin/Developer/scripts/fliccs.sh
```

(`tessro.sh` still works as a thin wrapper to the same script.)

This fetches Twilio tokens, patches `useWebRTC.js`, commits, and pushes (`TURN Server Maintenance`).

## Manual curl (if needed)

```bash
curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Tokens.json" \
  -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}"
```

From the JSON response, copy:
- `username` → `turnCredentials.username`
- `password` → `turnCredentials.credential`
- Set `lastResetTimestamp` to now, e.g. `"2026-08-05 17:00"`

Do **not** change the `global.turn.twilio.com` / `global.stun.twilio.com` URLs.

## Check expiry

On the landing page, **Streaming Mode Available For:** — if expired/red, refresh before Stream Mode. Sync Mode does not need TURN.
