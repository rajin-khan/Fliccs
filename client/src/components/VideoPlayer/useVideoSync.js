// client/src/components/VideoPlayer/useVideoSync.js
import { useEffect, useRef, useCallback } from 'react';

function useVideoSync({ socket, sessionId, playerRef, sessionMode }) {
  // syncLock prevents the client from reacting to sync events
  // that were triggered by its own actions (or the sync mechanism itself).
  // It applies regardless of mode, as we don't want feedback loops if
  // the host in stream mode *does* emit some simplified sync event.
  const syncLock = useRef(false);

  const emitSyncAction = useCallback((action, value) => {
    // Only emit sync actions if in 'sync' mode
    if (sessionMode !== 'sync' || !socket || !sessionId) {
      return;
    }

    console.log(`[Sync] Emitting action: ${action}`, value ?? '');
    socket.emit('sync:action', {
      sessionId, // Server uses socket map, but doesn't hurt
      action,
      timestamp: Date.now(), // Good for potential server-side reconciliation later
      seekTime: value // For play/pause/seek
    });
  }, [socket, sessionId, sessionMode]);

  useEffect(() => {
    if (sessionMode !== 'sync' || !socket) {
      // If not in sync mode or no socket, ensure listener is off
      socket?.off('sync:action'); // Use optional chaining for safety
      return;
    }

    const handleSyncEvent = ({ action, seekTime }) => {
      const player = playerRef.current;
      // Also check mode here again, in case it changed while event was in flight
      if (!player || sessionMode !== 'sync') return;

      console.log(`[Sync] Received action: ${action}`, seekTime ?? '');
      syncLock.current = true;

      try {
        const internalPlayer = player.getInternalPlayer();
        if (!internalPlayer) {
            console.warn("[Sync] Internal player not available for sync action:", action);
            syncLock.current = false; // Release lock if action fails
            return;
        }

        switch (action) {
          case 'play':
            // Seek first to ensure correct position, then play
            // Use player.seekTo which might be more reliable across player types
            player.seekTo(seekTime, 'seconds');
            internalPlayer.play?.(); // Call play on the native element
            break;
          case 'pause':
            // Pause should ideally happen at the seekTime, but pausing immediately
            // is usually acceptable for sync. Seeking first might cause brief playback.
             internalPlayer.pause?.();
             // Optionally seek after pausing if precise position is critical
            break;
          case 'seek':
            player.seekTo(seekTime, 'seconds');
            break;
          default:
             console.warn(`[Sync] Received unknown action: ${action}`);
            break;
        }
      } catch (error) {
          console.error("[Sync] Error handling sync event:", action, error);
      }


      // Release the lock slightly later to allow the action to take effect
      // and prevent immediate re-triggering if events arrive rapidly.
      setTimeout(() => {
        syncLock.current = false;
      }, 250); // Increased timeout slightly
    };

    // Register the listener only if in sync mode
    console.log("[Sync] Hook active, listening for sync actions.");
    socket.on('sync:action', handleSyncEvent);

    // Cleanup function: remove the listener
    return () => {
      console.log("[Sync] Hook cleaning up listener.");
      socket.off('sync:action', handleSyncEvent);
    };

  }, [socket, sessionId, sessionMode, playerRef]);

  // Return the potentially restricted emit function and the lock ref
  return { emitSyncAction, syncLock };
}

export default useVideoSync;
