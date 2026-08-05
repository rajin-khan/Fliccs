import React, { useState, useEffect } from 'react';
import { FaShareAlt, FaCheckCircle, FaLink, FaCrown } from 'react-icons/fa';

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

    const buildShareableLink = () =>
        `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(sessionId)}&pass=${encodeURIComponent(sessionPassword)}`;

    const handleCopyInvite = () => {
        if (!sessionId || !sessionPassword) return;

        const inviteMessage = `
🥳 Join the watch party on Fliccs!
✨ Auto-join link: ${buildShareableLink()}
🔭 Session ID: ${sessionId}
🧧 Password: ${sessionPassword}

💡 Tip: Click the auto-join link above to join automatically. If the link is acting up, enter the ID and Password in Join mode.
    `.trim();

        navigator.clipboard.writeText(inviteMessage);
        setCopied(true);
    };

    const handleCopyShareableLink = () => {
        if (!sessionId || !sessionPassword) return;
        navigator.clipboard.writeText(buildShareableLink());
        setLinkCopied(true);
    };

    const isFull = participants.length >= 7;

    return (
        <div className="w-full h-full flex flex-col relative font-barlow min-h-0">
            {/* Copy toasts */}
            <div className={`absolute top-20 left-1/2 -translate-x-1/2 bg-[#0a0a12] border border-white/10 text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transition-all duration-300 z-40 pointer-events-none w-max ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <FaCheckCircle className="text-brand-primary" />
                <span>Invite copied</span>
            </div>
            <div className={`absolute top-20 left-1/2 -translate-x-1/2 bg-[#0a0a12] border border-white/10 text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transition-all duration-300 z-40 pointer-events-none w-max ${linkCopied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <FaCheckCircle className="text-brand-primary" />
                <span>Link copied</span>
            </div>

            {/* Invite actions */}
            <div className="shrink-0 px-4 pt-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleCopyShareableLink}
                        className="flex items-center justify-center gap-2 h-9 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-brand-primary/30 transition-all active:scale-[0.97]"
                    >
                        <FaLink className="text-[10px]" />
                        Copy link
                    </button>
                    <button
                        onClick={handleCopyInvite}
                        className="flex items-center justify-center gap-2 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 text-[11px] font-semibold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all active:scale-[0.97]"
                    >
                        <FaShareAlt className="text-[10px]" />
                        Copy invite
                    </button>
                </div>
                {isFull && (
                    <p className="mt-2.5 text-center text-[10px] font-bold text-red-400 bg-red-950/30 border border-red-500/20 px-2 py-1 rounded-full uppercase tracking-wider">
                        Room is full
                    </p>
                )}
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                <ul className="flex flex-col gap-1">
                    {participants.map((user) => {
                        const isSelf = user.id === selfId;
                        const isHost = user.id === hostId;
                        const fallbackName = user.nickname || `Guest ${user.id.slice(0, 4)}`;

                        return (
                            <li
                                key={user.id}
                                className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl animate-fade-in group transition-colors ${isSelf ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                        <img
                                            src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${user.id}`}
                                            alt={fallbackName}
                                            className="w-9 h-9 rounded-xl bg-white/5 ring-1 ring-white/10 opacity-90 group-hover:opacity-100 transition-opacity"
                                        />
                                        {isHost && (
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#05050d] border border-white/10 flex items-center justify-center" title="Host">
                                                <FaCrown className="text-yellow-400 text-[7px]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm leading-tight truncate transition-colors ${isSelf ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                            {fallbackName}
                                        </span>
                                        <span className="text-[10px] text-white/25 leading-tight">
                                            {isHost ? 'Host' : 'Guest'}{isSelf ? ' · You' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" title="Online" />
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default Participants;
