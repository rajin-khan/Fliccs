import React, { useState, useEffect } from 'react';
import { FaUsers, FaShareAlt, FaCheckCircle, FaLink } from 'react-icons/fa';

function Participants({ participants = [], hostId, selfId, sessionId, sessionPassword }) {
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    useEffect(() => {
        if (linkCopied) {
            const timer = setTimeout(() => setLinkCopied(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [linkCopied]);

    const handleCopyInvite = () => {
        if (!sessionId || !sessionPassword) return;

        const shareableLink = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(sessionId)}&pass=${encodeURIComponent(sessionPassword)}`;

        const inviteMessage = `
🥳 Join the watch party on Fliccs!
✨ Auto-join link: ${shareableLink}
🔭 Session ID: ${sessionId}
🧧 Password: ${sessionPassword}

💡 Tip: Click the auto-join link above to join automatically. If the link is acting up, enter the ID and Password in Join mode.
    `.trim();

        navigator.clipboard.writeText(inviteMessage);
        setCopied(true);
    };

    const handleCopyShareableLink = () => {
        if (!sessionId || !sessionPassword) return;

        const shareableLink = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(sessionId)}&pass=${encodeURIComponent(sessionPassword)}`;
        navigator.clipboard.writeText(shareableLink);
        setLinkCopied(true);
    };

    return (
        <div className="w-full h-full flex flex-col relative font-barlow min-h-0">
            {/* --- Beautiful Toast Notifications --- */}
            <div className={`absolute top-16 left-1/2 -translate-x-1/2 bg-[#111] border border-white/10 text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transition-all duration-300 z-50 pointer-events-none w-max ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <FaCheckCircle className="text-brand-primary" />
                <span>Copied!</span>
            </div>
            <div className={`absolute top-16 left-1/2 -translate-x-1/2 bg-[#111] border border-white/10 text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transition-all duration-300 z-50 pointer-events-none w-max ${linkCopied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <FaCheckCircle className="text-brand-primary" />
                <span>Link Copied!</span>
            </div>

            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                        <span>{participants.length} Online</span>
                    </h3>
                    {participants.length >= 7 && (
                        <span className="text-[9px] font-bold text-red-400 bg-red-950/30 border border-red-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Full
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyShareableLink}
                        title="Copy Link"
                        className="text-white/40 hover:text-white transition-colors p-1.5"
                    >
                        <FaLink size={12} />
                    </button>
                    <button
                        onClick={handleCopyInvite}
                        title="Invite"
                        className="text-white/40 hover:text-white transition-colors p-1.5"
                    >
                        <FaShareAlt size={12} />
                    </button>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                <ul className="flex flex-col gap-4">
                    {participants.map((user) => {
                        const isSelf = user.id === selfId;
                        const isHost = user.id === hostId;
                        const fallbackName = user.nickname || `Guest ${user.id.slice(0, 4)}`;

                        return (
                            <li key={user.id} className="flex items-center justify-between text-white animate-fade-in group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                        <img
                                            src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${user.id}`}
                                            alt={fallbackName}
                                            className="w-8 h-8 rounded-full bg-white/5 ring-1 ring-white/10 opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        {isHost && (
                                            <div className="absolute -top-1 -right-1 text-[8px] bg-black text-yellow-500 rounded-full p-0.5 border border-black shadow-sm" title="Host">
                                                👑
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm ${isSelf ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'} transition-colors truncate`}>
                                            {fallbackName} {isSelf && <span className="text-white/20 text-xs font-normal ml-1">(You)</span>}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default Participants;