# Fliccs launch checklist

## Routing now

- `https://fliccs.com/`: public landing page.
- `https://fliccs.com/watch`: Host/Join and the room. Bookmark this for direct access.
- Invites: `/watch?join=…&pass=…`; guests go directly to joining the room.
- `/landing`: permanent redirect to `/`.
- No automatic first-visit or returning-visitor redirect. No extra proxy or framework.
- Public pages are prerendered, with titles, descriptions, canonicals, social previews and structured data. `/watch` and invites are noindex and excluded from the sitemap. Noindex is not access control: anyone with an invite can use it.

## 1. Check the deployed build

Open these in a private window:

1. `https://fliccs.com/` — landing; Start Watching opens `/watch`.
2. `https://fliccs.com/watch` — Host/Join.
3. `https://fliccs.com/landing` — redirects to `/`.
4. `https://www.fliccs.com/watch?test=1` — redirects to `https://fliccs.com/watch?test=1`.
5. Create a room, copy its invite, and open it on another device. The URL starts with `/watch?join=` and offers to join directly.
6. Share that test invite in Messenger to inspect the preview. Use a disposable room: the link includes its password.

Leave the existing apex Railway DNS-only record and proxied `www` redirect in place. No additional Cloudflare proxy, cache-all rule or worker is needed for this change.

## 2. Test the product on real networks

Use a laptop host and a phone guest on mobile data, then swap guest browsers if available. Test both Sync and Stream:

- Guest joins before the host chooses a file.
- Host changes modes, then selects a file.
- Host changes files after the guest joins.
- Play, pause, seek, sound, fullscreen and chat.
- Refresh the guest and confirm playback resumes; tap the play prompt if shown.
- Refresh the host, reselect its local file if requested, and confirm guests recover.
- Leave and rejoin through a fresh invite.

Local browser checks cannot prove connectivity across mobile carriers or iOS in-app browsers.

## 3. Set up search indexing

1. Open Google Search Console and add a **Domain** property: `fliccs.com`.
2. Copy Google's exact TXT verification value.
3. Cloudflare → DNS → Add record: **TXT**, Name **@**, Content **the value Google supplied**, TTL **Auto**. Keep the Railway verification TXT record.
4. Return to Search Console and click Verify.
5. Open Sitemaps and submit `https://fliccs.com/sitemap.xml`.
6. Inspect `https://fliccs.com/`, run Test live URL, then Request indexing.
7. Check Pages and Core Web Vitals after Google collects data. Do not submit invite URLs or request indexing for `/watch`.

Indexing and rankings are not guaranteed or immediate. Leave crawlers able to read the noindex tags; do not add a robots.txt Disallow for room URLs.

Sources: [Search Console verification](https://support.google.com/webmasters/answer/9008080?hl=en), [sitemap submission](https://support.google.com/webmasters/answer/7451001?hl=en-GB), [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

## 4. Create a working support address

Create `support@fliccs.com` with a mailbox provider that supports sending and receiving. Add only that provider's supplied MX, SPF and DKIM records, and its recommended DMARC configuration. Do not guess these values or create multiple SPF records at the same hostname.

Send a message from an unrelated email account to the address and reply from `support@fliccs.com`. Verify both arrive. Forwarding alone does not demonstrate that replies can be sent from this address.

Then add the verified address to the site's support and policy content.

## 5. Ask Paddle about eligibility before building billing

Use Paddle's official support/contact route or your existing Paddle conversation. Review the draft for accuracy before sending:

**Subject:** Fliccs — eligibility for subscription billing

Hello Paddle team,

I'm building Fliccs (https://fliccs.com), a browser-based app for watching local videos together in private rooms. It synchronizes playback or lets a host stream to invited participants. We do not provide a film catalogue or sell access to films.

I'm based in Bangladesh and am exploring subscriptions for premium app features. Pricing and paid functionality are not finalized, and checkout is not live.

Could you confirm whether this business model and my location are eligible, and which business, identity, website and policy requirements I should complete before applying for live approval?

Thank you,
Rajin Khan

Do not describe future features as available. Confirm the seller's legal details during onboarding. Paddle approval has not been obtained by this code change.

Source: [Paddle setup checklist](https://developer.paddle.com/build/set-up-checklist/).

## 6. Finalize the paid offer and policies

The existing pricing, Premium modal and policy pages need a separate truthfulness review before accepting payments. Check participant limits, voice-chat claims, dates, prices, cancellation instructions and refund promises against what the app actually supports. These are not finalized by the SEO work.

Decide the paid benefit, participant limits and bandwidth budget first. Measure TURN relay costs and successful playback on real networks. Avoid promising unlimited streaming before costs are known.

## 7. Build the smallest paid version

Recommended starting point: guests remain account-free; only paying hosts sign in with an email link. Add a database for host identity and subscription entitlement when implementing billing.

Implement server-side entitlements and signed, idempotent Paddle webhooks. Test purchases, renewals, failed payments, cancellation, refunds and duplicate/out-of-order events in the sandbox. Never unlock Premium solely from a browser checkout success message.

Then complete live approval, run a small beta, and expand only after playback reliability and relay costs are understood.
