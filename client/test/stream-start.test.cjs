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
  const stream = { getTracks: () => tracks };
  const api = hook({
    socket: { emit: (name, data) => events.push({ name, data }) },
    sessionId: 'room', isHost: true, sessionMode: 'stream',
    participants: [{ id: 'host' }, { id: 'guest' }], selfId: 'host',
    localStreamSourceElement: { captureStream: () => stream },
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
