import { useState } from 'react';

// Add `onSessionStart` to the props
function CreateSession({ socket, isConnected, onSessionStart }) {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateSession = () => {
        if (!isConnected) {
            setError("You're not connected to the server.");
            return;
        }
        if (password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }

        setError('');
        setIsLoading(true);

        // Call the new prop with the password before emitting
        if (onSessionStart) {
            onSessionStart(password);
        }

        socket.emit('session:create', { password, nickname });
    };

    return (
        <div className="flex flex-col space-y-4 text-sm text-white font-barlow">
            <div className="w-full">
                <input
                    type="text"
                    aria-label="Your Nickname"
                    placeholder="Your Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-5 py-2.5 rounded-xl bg-brand-rich-black/60 border border-brand-tekhelet text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
                />
                <p className="text-xs text-gray-500 mt-1 px-1">
                    Leave blank for a random auto-generated name
                </p>
            </div>
            <input
                type="password"
                aria-label="Session Password"
                    placeholder="Session Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-2.5 rounded-xl bg-brand-rich-black/60 border border-brand-tekhelet text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
            />
            {error && <p role="alert" className="text-red-400 text-xs text-center">{error}</p>}
            <button
                onClick={handleCreateSession}
                disabled={!isConnected || isLoading}
                className={`w-full py-2.5 rounded-xl font-medium bg-brand-primary hover:bg-brand-grape transition-all ${(!isConnected || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {isLoading ? 'Creating...' : 'Create Session'}
            </button>
            {!isConnected && !isLoading && (
                <p className="text-xs text-yellow-400 text-center">Waiting for connection...</p>
            )}
        </div>
    );
}

export default CreateSession;