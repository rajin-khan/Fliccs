// Register listeners before assigning srcObject: WebKit may signal readiness immediately.
export function bindGuestPlayback(video, stream, onStatus) {
  let disposed = false;
  let timer;
  const status = value => { if (!disposed) onStatus(value); };
  const ready = () => { clearTimeout(timer); status('playing'); };
  const waiting = () => {
    clearTimeout(timer);
    timer = setTimeout(() => status('waiting'), 10_000);
  };
  const play = () => {
    status('loading');
    waiting();
    // Call synchronously from a click when autoplay requires a user gesture.
    try {
      return Promise.resolve(video.play()).then(() => {
        if (!video.paused && video.readyState >= 2) ready();
      }).catch(error => {
        if (disposed || error.name === 'AbortError') return;
        clearTimeout(timer);
        status(error.name === 'NotAllowedError' ? 'blocked' : 'error');
      });
    } catch {
      clearTimeout(timer);
      status('error');
      return Promise.resolve();
    }
  };
  const canPlay = () => { if (video.paused) play(); else if (video.readyState >= 2) ready(); };
  const failed = () => { clearTimeout(timer); status('error'); };
  video.addEventListener('playing', ready);
  video.addEventListener('canplay', canPlay);
  video.addEventListener('error', failed);
  video.addEventListener('waiting', waiting);
  video.playsInline = true;
  video.srcObject = stream;
  play();
  return {
    play,
    dispose() {
      disposed = true;
      clearTimeout(timer);
      video.removeEventListener('playing', ready);
      video.removeEventListener('canplay', canPlay);
      video.removeEventListener('error', failed);
      video.removeEventListener('waiting', waiting);
      if (video.srcObject === stream) video.srcObject = null;
    },
  };
}
