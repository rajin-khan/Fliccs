# Fliccs

Watch local videos together at [fliccs.com](https://fliccs.com). The homepage introduces Fliccs; [/watch](https://fliccs.com/watch) opens the product.

In Sync mode, everyone selects the same file and playback actions are shared. In Stream mode, the host sends their video to guests through WebRTC. Rooms have invite links, passwords, and chat. Guests do not need accounts.

## Code map

- `client/src/App.jsx`: route table and page metadata.
- `client/src/pages/`: public pages and `WatchPage.jsx`, which owns room entry and resume state.
- `client/src/components/RoomEntry.jsx`: host and join forms.
- `client/src/components/Layout/`: shared headers and information-page layout.
- `client/src/components/StreamRoom.jsx`: room interface; `Session/`, `Chat/`, and `VideoPlayer/` contain its controls.
- `client/src/hooks/`: socket lifecycle and WebRTC negotiation. `services/socket.js` owns the shared socket.
- `client/src/seo/`: public route metadata, structured data, and invite previews. `scripts/prerender.mjs` uses the same page list to generate HTML and the sitemap.
- `server/src/handlers/`: session, chat, and playback events. `server/src/turn.js` provides temporary relay credentials.
- `client/test/` and `server/test/`: playback, recovery, TURN, and HTTP regression checks.

## Local development

Use pnpm. Install only dependency versions that satisfy the project's minimum seven-day age policy.

```sh
pnpm install --frozen-lockfile
pnpm --dir client install --frozen-lockfile
pnpm --dir server install --frozen-lockfile
```

Run the server and client in separate terminals:

```sh
pnpm --dir server start
```

```sh
pnpm --dir client dev
```

The development client connects to `http://localhost:3001` by default. Set `VITE_SERVER_URL` if using another local server port. Production uses the site's own origin.

## Verify and build

```sh
pnpm run build
node --test client/test/*.test.cjs server/test/*.test.js
```

Build first: the HTTP checks inspect the generated pages and social images. `pnpm start` serves the production build and Socket.IO together. `client/test/relay.html` is a development-only browser check for forced relay connections and autoplay recovery. Start Vite against the local server and open `/test/relay.html` in two tabs using `localhost` and `127.0.0.1`. Check received bytes and decoded frames; a live remote track alone does not prove playback.

## Deployment and TURN

Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` privately on the server. Temporary ICE credentials are issued only to room members, cached, and renewed on demand before expiry. A desktop cron job is not required. Never prefix these secrets with `VITE_` or commit their values. For local streaming, supply them in the server shell or an ignored environment file; Sync mode does not require TURN.

WebRTC can use direct connections or a paid TURN relay. Fliccs does not store video files on its application server. Room and resume state currently live in server memory, so a server restart clears them. Streaming quality depends on the host, viewers, and network paths.

## Credits

Made by [Rajin Khan](https://rajinkhan.com). See [LICENSE](LICENSE) for license terms.
