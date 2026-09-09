import { useState } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';

const prompts = [
    ['What is Fliccs?', 'A tiny private room for watching a film together.'],
    ['How does sync work?', 'One person plays. Everyone stays on the same frame.'],
    ['Can I bring friends?', 'Send them the invite link. They can walk straight in.'],
    ['Why this film?', 'It felt like the right little movie for tonight.'],
];

const randomSeed = () => `cartoon-guest-${Math.floor(Math.random() * 100000)}`;

export default function CartoonChat({ onClose }) {
    const [messages, setMessages] = useState([
        { id: 'welcome', author: 'Tessro', text: 'I picked this one for you. Ask me anything.', tessro: true },
    ]);
    const [seed] = useState(randomSeed);

    function ask(question, answer) {
        setMessages((current) => [
            ...current,
            { id: `${question}-${Date.now()}`, author: 'You', text: question, seed },
            { id: `${question}-answer-${Date.now()}`, author: 'Tessro', text: answer, tessro: true },
        ]);
    }

    return (
        <aside className="cartoon-chat" aria-label="Fliccs chat">
            <div className="cartoon-chat-header">
                <div className="cartoon-chat-heading"><FaComments aria-hidden="true" /><span>Chat</span></div>
                <button type="button" onClick={onClose} aria-label="Hide chat" title="Hide chat"><FaTimes aria-hidden="true" /></button>
            </div>
            <div className="cartoon-chat-messages" aria-live="polite">
                {messages.map((message) => (
                    <div className={`cartoon-chat-message ${message.tessro ? 'is-tessro' : 'is-self'}`} key={message.id}>
                        {message.tessro && <img src="/fliccs-icon.png" alt="Tessro" />}
                        <div className="cartoon-chat-bubble-wrap">
                            <span>{message.author}</span>
                            <p>{message.text}</p>
                        </div>
                        {!message.tessro && <img src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${message.seed}`} alt="You" />}
                    </div>
                ))}
            </div>
            <div className="cartoon-chat-prompts" aria-label="Ask Tessro">
                <p>Ask Tessro</p>
                <div className="cartoon-chat-prompt-list">
                    {prompts.map(([question, answer]) => <button type="button" key={question} onClick={() => ask(question, answer)}>{question}</button>)}
                </div>
            </div>
        </aside>
    );
}
