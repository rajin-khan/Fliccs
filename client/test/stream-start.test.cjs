const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('guest already present receives offer when capture becomes ready', async () => {
  const code = fs.readFileSync('client/src/hooks/useWebRTC.js', 'utf8')
    .replace(/import .* from 'react';/, '')
    .replace('export const turnCredentials', 'const turnCredentials')
    .replace('export default useWebRTC;', 'return useWebRTC;');
  const events = [], tracks = [];
  class Peer {
    constructor() { this.iceConnectionState = 'new'; }
    addTrack(track) { assert.equal(track.readyState, 'live'); }
    async createOffer() { return { type: 'offer', sdp: 'test' }; }
    async setLocalDescription() {}
    getReceivers() { return []; }
    close() {}
  }
  const hook = new Function('useState', 'useEffect', 'useRef', 'useCallback', 'RTCPeerConnection', code)(
    value => [value, () => {}], () => {}, value => ({ current: value }), fn => fn, Peer,
  );
  const stream = { getTracks: () => tracks, getVideoTracks: () => tracks.filter(track => track.kind === 'video') };
  const api = hook({
    socket: { emit: (name, data) => events.push({ name, data }) },
    sessionId: 'room', isHost: true, sessionMode: 'stream',
    participants: [{ id: 'host' }, { id: 'guest' }], selfId: 'host',
    localStreamSourceRef: { current: { captureStream: () => stream } },
  });
  await api.startStreaming();
  assert.equal(events.length, 0);
  tracks.push({ readyState: 'live', kind: 'video', stop() {} });
  await api.startStreaming();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(events.length, 1);
  assert.equal(events[0].name, 'webrtc:offer');
  assert.equal(events[0].data.targetUserId, 'guest');
  api.stopStreaming();
});

test('a received track does not stop recovery while ICE is stalled', async () => {
  const code = fs.readFileSync('client/src/hooks/useWebRTC.js', 'utf8')
    .replace(/import .* from 'react';/, '')
    .replace('export const turnCredentials', 'const turnCredentials')
    .replace('export default useWebRTC;', 'return useWebRTC;');
  const effects = [], timers = [], handlers = {}, events = [], peers = [];
  let now = 0;
  class Peer {
    constructor() { this.iceConnectionState = 'new'; peers.push(this); }
    async setRemoteDescription() {}
    async createAnswer() { return { type: 'answer', sdp: 'test' }; }
    async setLocalDescription() { this.signalingState = 'stable'; }
    getReceivers() { return []; }
    close() {}
  }
  const hook = new Function('useState', 'useEffect', 'useRef', 'useCallback',
    'RTCPeerConnection', 'RTCSessionDescription', 'setTimeout', 'setInterval', 'Date', code)(
    value => [value, () => {}], effect => effects.push(effect),
    value => ({ current: value }), fn => fn, Peer, class { constructor(data) { Object.assign(this, data); } },
    fn => timers.push(fn), fn => timers.push(fn), { now: () => now },
  );
  hook({
    socket: { connected: true, on: (event, fn) => { handlers[event] = fn; }, emit: (event) => events.push(event) },
    sessionId: 'room', isHost: false, sessionMode: 'stream',
    participants: [{ id: 'host' }, { id: 'guest' }], selfId: 'guest',
    localStreamSourceRef: { current: null },
  });
  effects.forEach(effect => effect());
  await handlers['webrtc:offer']({ fromUserId: 'host', offer: { type: 'offer', sdp: 'test' } });
  peers[0].ontrack({ track: { kind: 'video', readyState: 'live' },
    streams: [{ id: 'remote', getVideoTracks: () => [{ readyState: 'live' }] }] });
  now = 20000;
  timers.forEach(fn => fn());
  assert.ok(events.includes('webrtc:request-offer'));
  events.length = 0;
  peers[0].iceConnectionState = 'connected';
  timers.forEach(fn => fn());
  assert.ok(!events.includes('webrtc:request-offer'));
});
