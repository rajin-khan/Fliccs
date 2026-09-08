import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIceProvider, registerIceHandler } from '../src/turn.js';

test('TURN refreshes before expiry, shares concurrent requests, and retries provider failures', async () => {
  let now = 0, calls = 0, fail = false;
  const get = createIceProvider({ env: { TWILIO_ACCOUNT_SID: 'test', TWILIO_AUTH_TOKEN: 'secret' }, now: () => now,
    fetchToken: async (_url, options) => {
      calls++;
      assert.equal(options.body, 'Ttl=3600');
      return { ok: !fail, status: 503, json: async () => ({ ttl: '3600', ice_servers: [{ url: 'turn:example.test:3478', username: 'temporary', credential: 'temporary' }] }) };
    } });
  const [a,b] = await Promise.all([get(),get()]);
  assert.equal(calls,1); assert.equal(a,b); assert.equal(a.iceServers[0].urls,'turn:example.test:3478');
  now = 3_000_000; await get(); assert.equal(calls,1);
  now = 3_400_000; fail = true; await assert.rejects(get(),/503/);
  fail = false; await get(); assert.equal(calls,3);
});

test('TURN credentials require room membership and requests are throttled', async () => {
  let handler, calls = 0, response;
  const socket = { id: 'guest', on: (_name, fn) => { handler = fn; } };
  const sessions = new Map([['room', { users: [{ id: 'guest' }] }]]), memberships = new Map();
  registerIceHandler(socket,sessions,memberships,async () => { calls++; return { iceServers: [] }; });
  await handler(value => { response = value; }); assert.match(response.error,/Join/); assert.equal(calls,0);
  memberships.set('guest','room'); await handler(value => { response = value; }); assert.equal(calls,1);
  await handler(value => { response = value; }); assert.match(response.error,/wait/); assert.equal(calls,1);
});
