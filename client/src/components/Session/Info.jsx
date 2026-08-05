import React from 'react';

/**
 * Session mode control.
 * Host: segmented Sync / Stream switch (emits `session:set_mode`).
 * Guest: read-only pill showing the current mode.
 */
function SessionInfo({ socket, sessionMode, isHost }) {

  const setMode = (mode) => {
    if (!socket || !isHost || mode === sessionMode) return;
    socket.emit('session:set_mode', { mode });
  };

  if (!isHost) {
    return (
      <div
        className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
        title={`Session mode: ${sessionMode}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${sessionMode === 'stream' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-brand-primary'}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70 capitalize">
          {sessionMode}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center h-9 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
      role="group"
      aria-label="Session mode"
    >
      {['sync', 'stream'].map((mode) => {
        const active = sessionMode === mode;
        return (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            aria-pressed={active}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all active:scale-[0.97] ${active
              ? 'bg-brand-primary text-white shadow-[0_0_16px_-4px_rgba(100,53,172,0.8)]'
              : 'text-white/40 hover:text-white/80'}`}
          >
            {mode}
          </button>
        );
      })}
    </div>
  );
}

export default SessionInfo;
