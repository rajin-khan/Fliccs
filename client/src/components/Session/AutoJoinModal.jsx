import React, { useState } from 'react';
import BrandLogo from '../BrandLogo';

function AutoJoinModal({ sessionId, password, socket, isConnected, onJoin, onCancel }) {
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleJoin = () => {
        if (!isConnected) {
            setError('Not connected to server.');
            return;
        }

        setError('');
        setIsJoining(true);

        const name = nickname.trim() || `Guest${Math.floor(Math.random() * 1000)}`;

        // Emit join event
        socket.emit('session:join', { sessionId, password, nickname: name });

        // Listen for response
        const handleJoinSuccess = () => {
            setIsJoining(false);
            if (onJoin) onJoin(password);
            socket.off('session:joined', handleJoinSuccess);
            socket.off('session:error', handleJoinError);
        };

        const handleJoinError = ({ error: errorMsg }) => {
            setError(errorMsg || 'Failed to join session.');
            setIsJoining(false);
            socket.off('session:joined', handleJoinSuccess);
            socket.off('session:error', handleJoinError);
        };

        socket.once('session:joined', handleJoinSuccess);
        socket.once('session:error', handleJoinError);
    };

    const handleCancel = () => {
        // Clear URL params
        const url = new URL(window.location);
        url.searchParams.delete('join');
        url.searchParams.delete('pass');
        window.history.replaceState({}, '', url);
        if (onCancel) onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/95 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-3xl max-w-md w-full mx-auto shadow-2xl animate-fade-in-up font-barlow relative overflow-hidden">

                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-[50px] rounded-full pointer-events-none" />

                {/* Logo and header */}
                <div className="flex flex-col items-center mb-8 relative z-10">
                    <BrandLogo size="lg" className="mb-4" />
                    <h2 className="text-xl text-white font-medium tracking-tight">Join Session</h2>
                    <p className="text-gray-400 text-center text-sm font-light mt-1">
                        You've been invited to watch together.
                    </p>
                </div>

                <div className="flex flex-col space-y-6 relative z-10">
                    <div className="w-full space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-medium ml-1">Nickname</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isJoining && isConnected) {
                                    handleJoin();
                                }
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all duration-200 text-base font-light"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-200 text-center">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={handleCancel}
                            disabled={isJoining}
                            className="flex-1 px-4 py-3 rounded-full font-medium bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all duration-200 text-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleJoin}
                            disabled={!isConnected || isJoining}
                            className="flex-1 px-4 py-3 rounded-full font-medium bg-brand-primary text-white hover:bg-brand-tekhelet transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 hover:scale-[1.02]"
                        >
                            {isJoining ? 'Joining...' : isConnected ? 'Join Now' : 'Connecting...'}
                        </button>
                    </div>

                    {!isConnected && !isJoining && (
                        <p className="text-xs text-yellow-500/80 text-center">Connecting to server...</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AutoJoinModal;
