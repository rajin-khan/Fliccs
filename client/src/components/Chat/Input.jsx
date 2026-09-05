import { useState } from 'react';

function ChatInput({ onSend }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText('');
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="shrink-0 flex items-center w-full font-barlow px-3 pt-2.5 border-t border-white/5 bg-white/[0.02] pb-[max(0.625rem,env(safe-area-inset-bottom))]"
        >
            <div className="relative flex-1 flex items-center">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    aria-label="Chat message"
                    className="w-full pl-4 pr-12 py-2.5 bg-white/[0.05] text-sm text-gray-200 placeholder-white/25 border border-white/10 rounded-full focus:outline-none focus:border-brand-primary/50 focus:bg-white/[0.07] transition-all duration-200"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    aria-label="Send message"
                    className="absolute right-1.5 p-2 rounded-full bg-brand-primary text-white hover:bg-brand-primary/80 active:scale-95 disabled:opacity-0 disabled:scale-75 transition-all duration-200 shadow-[0_4px_16px_-6px_rgba(100,53,172,0.6)]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                    </svg>
                </button>
            </div>
        </form>
    );
}

export default ChatInput;
