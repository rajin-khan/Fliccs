import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerSessionHandlers } from '../src/handlers/session.js';

test('host and guest resume with private tokens; explicit leave ends room', () => {
  const sessions = new Map(), membership = new Map();
  const io = { to: () => ({ emit() {} }), socketsLeave() {} };
  function connect(id) {
    const handlers = {}, events = [];
    const socket = {
      id, on: (name, fn) => { handlers[name] = fn; },
      emit: (name, data) => events.push({ name, data }),
      join() {}, leave() {}, to: io.to,
    };
    registerSessionHandlers(io, socket, sessions, membership);
    return { send: (name, data) => handlers[name](data),
      last: name => events.findLast(event => event.name === name)?.data,
      has: name => events.some(event => event.name === name) };
  }
  const host = connect('host');
  host.send('session:create', { nickname: 'Host', password: 'secret' });
  const created = host.last('session:created');
  const guest = connect('guest');
  guest.send('session:join', { sessionId: created.sessionId, password: 'secret', nickname: 'Guest' });
  const joined = guest.last('session:joined');
  host.send('session:set_mode', { mode: 'stream' });
  host.send('disconnect', 'refresh');
  assert.equal(sessions.size, 1);
  const attacker = connect('attacker');
  attacker.send('session:resume', { sessionId: created.sessionId, resumeToken: 'wrong' });
  assert.ok(attacker.has('session:resume_failed'));
  const newHost = connect('new-host');
  newHost.send('session:resume', created);
  assert.equal(sessions.get(created.sessionId).host, 'new-host');
  assert.equal(newHost.last('session:joined').mode, 'stream');
  guest.send('disconnect', 'refresh');
  const newGuest = connect('new-guest');
  newGuest.send('session:resume', joined);
  assert.deepEqual(sessions.get(created.sessionId).users.map(u => u.id), ['new-host', 'new-guest']);
  newGuest.send('session:leave');
  const stale = connect('stale');
  stale.send('session:resume', joined);
  assert.ok(stale.has('session:resume_failed'));
  newHost.send('session:leave');
  assert.equal(sessions.size, 0);
});
