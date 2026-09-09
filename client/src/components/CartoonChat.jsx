import { useState } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatMessages from './Chat/Messages';

const prompts = [
    ['What is Fliccs?', 'A tiny private room for watching a film together.'],
    ['How does sync work?', 'One person plays. Everyone stays on the same frame.'],
    ['Can I bring friends?', 'Send them the invite link. They can walk straight in.'],
    ['Why this film?', 'It felt like the right little movie for tonight.'],
];

const randomSeed = () => `cartoon-guest-${Math.floor(Math.random() * 100000)}`;

export default function CartoonChat({ onClose }) {
    const [messages, setMessages] = useState([
        { id: 'welcome', senderId: 'fliccs', nickname: 'Fliccs', text: 'I picked this one for you. Ask me anything.', avatarSrc: '/fliccs-icon.png', timestamp: 'welcome' },
    ]);
    const [seed] = useState(randomSeed);

    function ask(question, answer) {
        setMessages((current) => [
            ...current,
            { id: `${question}-${Date.now()}`, senderId: 'cartoon-you', nickname: 'You', text: question, avatarSrc: `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${seed}`, timestamp: `${Date.now()}-question` },
            { id: `${question}-answer-${Date.now()}`, senderId: 'fliccs', nickname: 'Fliccs', text: answer, avatarSrc: '/fliccs-icon.png', timestamp: `${Date.now()}-answer` },
        ]);
    }

    return (
        <aside className="cartoon-chat" aria-label="Fliccs chat">
            <div className="cartoon-chat-header">
                <div className="cartoon-chat-heading"><FaComments aria-hidden="true" /><span>Chat</span></div>
                <button type="button" onClick={onClose} aria-label="Hide chat" title="Hide chat"><FaTimes aria-hidden="true" /></button>
            </div>
            <div className="cartoon-chat-messages" aria-live="polite">
                <ChatMessages messages={messages} selfId="cartoon-you" />
            </div>
            <div className="cartoon-chat-prompts" aria-label="Ask Fliccs">
                <p>Ask Fliccs</p>
                <div className="cartoon-chat-prompt-list">
                    {prompts.map(([question, answer]) => <button type="button" key={question} onClick={() => ask(question, answer)}>{question}</button>)}
                </div>
            </div>
        </aside>
    );
}
