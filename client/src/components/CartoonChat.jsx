import { useEffect, useRef, useState } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatMessages from './Chat/Messages';

const getPrompts = (cartoon) => [
    ['What is Fliccs?', 'Fliccs gives you a private room where friends can watch the same video together. Pick Sync when everyone has the file, or Stream when one person shares their playback.'],
    ['What is this preview?', 'This is a small preview of the Fliccs player. Play or pause, skip ten seconds, change the volume, go fullscreen, hide chat, and switch films with the arrows.'],
    ['What do the arrows do?', 'The right arrow picks another film at random. The left arrow takes you back through up to three recent picks, so you can retrace your little film trail.'],
    ['Tell me about this film', `${cartoon.title}${cartoon.year ? ` is a ${cartoon.year} ` : ' is a '}short available through the Internet Archive. Rajin picked it for tonight. Use either arrow if you want a different one.`],
    ['How do I start a room?', 'Choose Start Watching, pick Sync or Stream, then send the invite link. Keep Fliccs open while your friends join and you are ready to go.'],
    ['How do friends join?', 'Send them the invite link. It opens in their browser, so they can join without an app, a download, or an account.'],
    ['What is Sync mode?', 'Sync mode keeps the same video file on each device and lines up play, pause, and seeking. It is the best choice when everyone has a copy of the video.'],
    ['What is Stream mode?', 'Stream mode lets one person choose the video and share the playback with the room. Your friends can watch from the link even if they do not have the file.'],
    ['Can we chat while watching?', 'Yes. Room chat stays beside the player in fullscreen, so you can talk without leaving the film. Hide it when you want the picture to take over.'],
    ['Do I need an account?', 'No. Start or join with a room link. There is no profile to set up and nothing to remember unless the host adds a room password.'],
    ['Is my video uploaded?', 'Fliccs does not publish your file to a public library. Sync keeps the file on each device, and Stream shares the host playback with the room.'],
    ['Can I use my phone?', 'Yes, Fliccs runs in a browser. Sync mode needs the same video file on your phone, while Stream mode lets the host share playback with everyone.'],
    ['Can I watch fullscreen?', 'Yes. Use the fullscreen control in the player. You can keep chat open beside the video or hide it for a cleaner view.'],
    ['Is Fliccs free?', 'You can start watching and invite friends without an account. Any paid features will be clearly marked before you need to choose a plan.'],
];

const randomSeed = () => `cartoon-guest-${Math.floor(Math.random() * 100000)}`;

export default function CartoonChat({ cartoon, onClose, open }) {
    const prompts = getPrompts(cartoon);
    const filmYear = cartoon.year ? `${cartoon.year} ` : '';
    const [messages, setMessages] = useState([
        { id: 'welcome', senderId: 'fliccs', nickname: 'Fliccs', text: `Rajin picked ${cartoon.title} for you tonight. It is a ${filmYear}short available through the Internet Archive. Use the left or right arrow if you want another film.`, avatarSrc: '/fliccs-icon.png', timestamp: 'welcome' },
    ]);
    const [seed] = useState(randomSeed);
    const [typing, setTyping] = useState(null);
    const answerTimer = useRef(null);

    useEffect(() => () => clearTimeout(answerTimer.current), []);

    function ask(question, answer) {
        if (typing) return;
        const now = Date.now();
        setMessages((current) => [
            ...current,
            { id: `${question}-${now}`, senderId: 'cartoon-you', nickname: 'You', text: question, avatarSrc: `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${seed}`, timestamp: `${now}-question` },
        ]);
        setTyping({ nickname: 'Fliccs', avatarSrc: '/fliccs-icon.png' });
        answerTimer.current = setTimeout(() => {
            setMessages((current) => [...current, { id: `${question}-${now}-answer`, senderId: 'fliccs', nickname: 'Fliccs', text: answer, avatarSrc: '/fliccs-icon.png', timestamp: `${now}-answer` }]);
            setTyping(null);
        }, 760);
    }

    return (
        <aside className={`cartoon-chat${open ? ' is-open' : ''}`} aria-label="Fliccs chat" aria-hidden={!open} inert={!open}>
            <div className="cartoon-chat-header">
                <div className="cartoon-chat-heading"><FaComments aria-hidden="true" /><span>Chat</span></div>
                <button type="button" onClick={onClose} aria-label="Hide chat" title="Hide chat"><FaTimes aria-hidden="true" /></button>
            </div>
            <div className="cartoon-chat-messages" aria-live="polite">
                <ChatMessages messages={messages} selfId="cartoon-you" typing={typing} />
            </div>
            <div className="cartoon-chat-prompts" aria-label="Ask Fliccs">
                <p>Ask Fliccs</p>
                <div className="cartoon-chat-prompt-list">
                    {prompts.map(([question, answer]) => <button type="button" key={question} onClick={() => ask(question, answer)} disabled={Boolean(typing)}>{question}</button>)}
                </div>
            </div>
        </aside>
    );
}
