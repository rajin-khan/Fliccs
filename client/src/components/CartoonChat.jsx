import { useState } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatMessages from './Chat/Messages';

const prompts = [
    ['What is Fliccs?', 'Fliccs gives you a private room where friends can watch the same video together. Pick Sync when everyone has the file, or Stream when one person shares their playback.'],
    ['Do I need an account?', 'No. Start or join with a room link. There is no profile to set up and nothing to remember unless the host adds a room password.'],
    ['How do I start a room?', 'Choose Start Watching, pick Sync or Stream, then send the invite link. Keep Fliccs open while your friends join and you are ready to go.'],
    ['How do friends join?', 'Send them the invite link. It opens in their browser, so they can join without an app, a download, or an account.'],
    ['What is Sync mode?', 'Sync mode keeps the same video file on each device and lines up play, pause, and seeking. It is the best choice when everyone has a copy of the video.'],
    ['What is Stream mode?', 'Stream mode lets one person choose the video and share the playback with the room. Your friends can watch from the link even if they do not have the file.'],
    ['Can we chat while watching?', 'Yes. Room chat stays beside the player in fullscreen, so you can talk without leaving the film. Hide it when you want the picture to take over.'],
    ['Can I use my phone?', 'Yes, Fliccs runs in a browser. Sync mode needs the same video file on your phone, while Stream mode lets the host share playback with everyone.'],
    ['Is my video uploaded?', 'Fliccs does not publish your file to a public library. Sync keeps the file on each device, and Stream shares the host playback with the room.'],
    ['Can I watch fullscreen?', 'Yes. Use the fullscreen control in the player. You can keep chat open beside the video or hide it for a cleaner view.'],
    ['Can I change the film?', 'Use the arrows on either side of the player. The right arrow picks a new film, and the left arrow takes you back through your last few picks.'],
    ['Why is this film slow?', 'The preview uses public archive copies, and some copies take longer to answer or are unavailable. Try Next film and Fliccs will pick another one.'],
    ['Why this film?', 'It is a small pick from the cartoon shelf for tonight. If it is not your mood, tap the right arrow and Fliccs will find another.'],
    ['Is Fliccs free?', 'You can start watching and invite friends without an account. Any paid features will be clearly marked before you need to choose a plan.'],
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
