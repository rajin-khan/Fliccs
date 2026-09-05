import { useState, useEffect, useCallback } from 'react';
import { FaLink, FaShareAlt, FaCheckCircle } from 'react-icons/fa';

function buildShareableLink(sessionId, sessionPassword) {
    return `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(sessionId)}&pass=${encodeURIComponent(sessionPassword)}`;
}

function buildInviteMessage(sessionId, sessionPassword) {
    return `
🥳 Join the watch party on Fliccs!
✨ Auto-join link: ${buildShareableLink(sessionId, sessionPassword)}
🔭 Session ID: ${sessionId}
🧧 Password: ${sessionPassword}

💡 Tip: Click the auto-join link above to join automatically. If the link is acting up, enter the ID and Password in Join mode.
    `.trim();
}

/**
 * Primary invite CTA — copy join link (and optional full invite text).
 * `prominent` = filled brand button for the top bar.
 * `panel` = dual buttons for the People tab.
 */
function InviteButton({ sessionId, sessionPassword, variant = 'prominent' }) {
    const [toast, setToast] = useState(null); // 'link' | 'invite' | null

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(t);
    }, [toast]);

    const copyLink = useCallback(() => {
        if (!sessionId || !sessionPassword) return;
        navigator.clipboard.writeText(buildShareableLink(sessionId, sessionPassword));
        setToast('link');
    }, [sessionId, sessionPassword]);

    const copyInvite = useCallback(() => {
        if (!sessionId || !sessionPassword) return;
        navigator.clipboard.writeText(buildInviteMessage(sessionId, sessionPassword));
        setToast('invite');
    }, [sessionId, sessionPassword]);

    if (variant === 'panel') {
        return (
            <div className="relative">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={copyLink}
                        className="flex items-center justify-center gap-2 h-10 rounded-full bg-brand-primary text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-brand-primary/85 shadow-[0_0_24px_-6px_rgba(100,53,172,0.7)] transition-all active:scale-[0.97]"
                    >
                        <FaLink className="text-[10px]" />
                        Copy link
                    </button>
                    <button
                        onClick={copyInvite}
                        className="flex items-center justify-center gap-2 h-10 rounded-full bg-white/5 border border-white/10 text-white/70 text-[11px] font-semibold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all active:scale-[0.97]"
                    >
                        <FaShareAlt className="text-[10px]" />
                        Full invite
                    </button>
                </div>
                <Toast toast={toast} />
            </div>
        );
    }

    // Prominent top-bar CTA
    return (
        <div className="relative flex items-center gap-1.5">
            <button
                onClick={copyLink}
                title="Copy join link"
                className="flex items-center gap-2 h-9 px-3.5 sm:px-4 rounded-full bg-brand-primary text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-brand-primary/85 shadow-[0_0_24px_-4px_rgba(100,53,172,0.85)] transition-all active:scale-[0.97]"
            >
                <FaLink className="text-[10px]" />
                <span>Invite</span>
            </button>
            <button
                onClick={copyInvite}
                title="Copy full invite message"
                className="hidden sm:flex items-center justify-center h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-[0.97]"
            >
                <FaShareAlt className="text-[11px]" />
            </button>
            <Toast toast={toast} />
        </div>
    );
}

function Toast({ toast }) {
    return (
        <div
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#0a0a12] border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl transition-all duration-300 z-50 pointer-events-none whitespace-nowrap ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
        >
            <FaCheckCircle className="text-brand-primary text-[10px]" />
            <span>{toast === 'invite' ? 'Invite copied' : 'Link copied'}</span>
        </div>
    );
}

export default InviteButton;
