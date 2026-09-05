import { FaCrown } from 'react-icons/fa';
import InviteButton from './InviteButton';

function Participants({ participants = [], hostId, selfId, sessionId, sessionPassword }) {
    const isFull = participants.length >= 7;

    return (
        <div className="w-full h-full flex flex-col relative font-barlow min-h-0">
            {/* Invite actions — primary CTAs also live in the top bar */}
            <div className="shrink-0 px-4 pt-4 pb-3">
                <InviteButton
                    sessionId={sessionId}
                    sessionPassword={sessionPassword}
                    variant="panel"
                />
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
                        const isHostUser = user.id === hostId;
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
                                        {isHostUser && (
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
                                            {isHostUser ? 'Host' : 'Guest'}{isSelf ? ' · You' : ''}
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
