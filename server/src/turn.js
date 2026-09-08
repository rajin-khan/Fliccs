// Only short-lived ICE credentials leave this module. Account secrets stay server-side.
export function createIceProvider({ env = process.env, fetchToken = fetch, now = Date.now } = {}) {
  let cached, pending;
  return async () => {
    if (cached && cached.expiresAt > now() + 300_000) return cached;
    if (!pending) {
      pending = (async () => {
        const sid = env.TWILIO_ACCOUNT_SID;
        const secret = env.TWILIO_AUTH_TOKEN;
        if (!sid || !secret) throw new Error('TURN is not configured on the server');
        const response = await fetchToken(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Tokens.json`, {
          method: 'POST',
          headers: { Authorization: `Basic ${Buffer.from(`${sid}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'Ttl=3600',
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`TURN provider returned HTTP ${response.status}`);
        const data = await response.json();
        const iceServers = data.ice_servers?.map(({ urls, url, username, credential }) => ({ urls: urls || url, ...(username && { username, credential }) }));
        const ttl = Number(data.ttl);
        if (!iceServers?.some(s => /^turns?:/.test(s.urls) && s.username && s.credential) || !Number.isFinite(ttl) || ttl <= 300) throw new Error('Invalid TURN provider response');
        cached = { iceServers, expiresAt: now() + ttl * 1000 };
        return cached;
      })().finally(() => { pending = null; });
    }
    return pending;
  };
}

export function registerIceHandler(socket, sessions, socketToSessionMap, getIce) {
  let lastRequest = -Infinity;
  socket.on('webrtc:config', async (reply) => {
    if (typeof reply !== 'function') return;
    const sessionId = socketToSessionMap.get(socket.id);
    const session = sessions.get(sessionId);
    if (!session?.users.some(user => user.id === socket.id)) return reply({ error: 'Join a room before starting a stream.' });
    if (Date.now() - lastRequest < 2000) return reply({ error: 'Please wait before reconnecting.' });
    lastRequest = Date.now();
    try {
      const config = await getIce();
      if (socketToSessionMap.get(socket.id) !== sessionId || !session.users.some(user => user.id === socket.id)) return;
      reply(config);
    } catch (error) {
      console.error('[TURN]', error.message);
      reply({ error: 'Streaming relay is unavailable. Please try again shortly.' });
    }
  });
}
