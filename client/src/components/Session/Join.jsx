import { useState, useEffect } from 'react';

// Add `onSessionStart` to the props
function JoinSession({ socket, isConnected, onSessionStart }) {
    const [sessionId, setSessionId] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleJoin = () => {
        if (!sessionId.trim() || !password.trim()) {
            setError('Session ID and password are required.');
            return;
        }
        if (!isConnected) {
            setError('Not connected to server.');
            return;
        }

        setError('');
        setIsJoining(true);

        const name = nickname.trim() || `Guest${Math.floor(Math.random() * 1000)}`;

        // Call the new prop with the password before emitting
        if (onSessionStart) {
            onSessionStart(password);
        }

        socket.emit('session:join', { sessionId, password, nickname: name });
    };

    useEffect(() => {
        // We only need to listen for errors here now. Success is handled by App.jsx
        const handleJoinError = ({ error }) => {
            setError(error);
            setIsJoining(false);
        };

        socket.on('session:error', handleJoinError);

        return () => {
            socket.off('session:error', handleJoinError);
        };
    }, [socket]);

    return (
        <div className="flex flex-col items-center space-y-5 w-full font-barlow">
            <input
                type="text"
                aria-label="Session ID"
                    placeholder="Session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-brand-rich-black border border-brand-primary/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
            />
            <input
                type="password"
                aria-label="Session Password"
                    placeholder="Session Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-brand-rich-black border border-brand-primary/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
            />
            <div className="w-full">
                <input
                    type="text"
                    aria-label="Your Nickname"
                    placeholder="Your Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-brand-rich-black border border-brand-tekhelet/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-tekhelet transition"
                />
                <p className="text-xs text-gray-500 mt-1 px-1">
                    Leave blank for a random auto-generated name
                </p>
            </div>
            {error && (
                <p role="alert" className="text-xs text-red-400 text-center">{error}</p>
            )}
            <button
                onClick={handleJoin}
                disabled={!isConnected || isJoining}
                className={`w-full px-4 py-2 rounded-full font-medium bg-brand-primary text-white hover:bg-brand-tekhelet transition ${(!isConnected || isJoining) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {isJoining ? 'Joining...' : isConnected ? 'Join Session' : 'Connecting...'}
            </button>
            {!isConnected && !isJoining && (
                <p className="text-xs text-yellow-400 text-center">Connecting to server...</p>
            )}
        </div>
    );
}

export default JoinSession;