import React, { useEffect, useRef } from 'react';
import { FaComments } from 'react-icons/fa';

function ChatMessages({ messages, selfId }) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                    <FaComments className="text-brand-primary/70" />
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                    No messages yet. Say hi to the room.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-3.5 px-4 py-4 overflow-y-auto h-full scrollbar-hide">
            {messages.map((msg, i) => {
                const isSelf = msg.senderId === selfId;
                const nickname = msg.nickname || 'Guest';

                return (
                    <div
                        key={msg.timestamp || i}
                        className={`flex items-end gap-2.5 ${isSelf ? 'justify-end' : 'justify-start'} group animate-fade-in`}
                    >
                        {!isSelf && (
                            <img
                                src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${msg.senderId}`}
                                alt={nickname}
                                className="w-6 h-6 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity shrink-0"
                                title={nickname}
                            />
                        )}
                        <div className={`flex flex-col max-w-[80%] ${isSelf ? 'items-end' : 'items-start'}`}>
                            {!isSelf && <span className="text-[10px] text-white/30 ml-1 mb-1">{nickname}</span>}
                            <div
                                className={`px-3.5 py-2 text-sm leading-relaxed break-words transition-all duration-200 ${isSelf
                                    ? 'bg-brand-primary text-white rounded-2xl rounded-br-md font-medium shadow-[0_4px_16px_-6px_rgba(100,53,172,0.5)]'
                                    : 'bg-white/[0.06] border border-white/5 text-gray-300 rounded-2xl rounded-bl-md'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatMessages;
