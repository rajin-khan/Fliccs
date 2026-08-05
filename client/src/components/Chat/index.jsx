import React from 'react';
import ChatInput from './Input.jsx';
import ChatMessages from './Messages.jsx';

function Chat({ socket, sessionId, messages, sendMessage }) {
    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-hidden relative min-h-0">
                <ChatMessages messages={messages} selfId={socket.id} />
                {/* Fade at the top so messages dissolve under the tab bar */}
                <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-[#05050d] to-transparent pointer-events-none" />
            </div>
            <ChatInput onSend={sendMessage} />
        </div>
    );
}

export default Chat;
