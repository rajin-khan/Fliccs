# Streaming relay credentials

Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` as private server environment variables in Railway. Never use a `VITE_` prefix or commit these values.

The server requests Twilio's `ice_servers` with a one-hour TTL, caches the result, and renews it five minutes before expiry. Room members fetch this configuration through `webrtc:config` before creating a peer connection. Existing browser tabs can obtain fresh credentials without a deployment.

The old `/Users/rajin/Developer/scripts/fliccs.sh` daily source-code updater is obsolete. Disable its scheduled invocation; do not run it against the new hook. No credentials belong in `useWebRTC.js` anymore.

For local development, supply the variables in the shell or start Node with an ignored environment file. Sync mode does not require TURN. Missing or rejected server credentials produce a streaming error rather than silently attempting STUN-only connections.

## Verification

Run `node --test client/test/*.test.cjs server/test/*.test.js` and `pnpm run build`.

Browser testing must include a relay-only connection, audio and decoded video, joining before source selection, late joining, mode changes, viewer refresh, host refresh with file re-selection, and source replacement. A live remote track alone does not prove media is flowing; inspect received bytes and decoded frames.

The development-only `client/test/relay.html` loads the real app but forces all peer connections through TURN and displays received bytes/frames. Start Vite against the local server and open `/test/relay.html` in two tabs using `localhost` and `127.0.0.1`. It is not part of the production build. The test button closes peer connections to exercise recovery.
