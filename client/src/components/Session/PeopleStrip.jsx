import { FaCrown } from 'react-icons/fa';

/**
 * Compact overlapping avatar strip for desktop top bars.
 * Click opens the People panel (parent handles onClick).
 */
function PeopleStrip({ participants = [], hostId, selfId, onClick }) {
    const maxVisible = 5;
    const visible = participants.slice(0, maxVisible);
    const overflow = participants.length - maxVisible;

    return (
        <button
            type="button"
            onClick={onClick}
            title={`${participants.length} in the room`}
            className="hidden lg:flex items-center gap-2.5 h-9 pl-1.5 pr-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/55 transition-all active:scale-[0.98] group"
        >
            <div className="flex items-center -space-x-2">
                {visible.map((user) => {
                    const name = user.nickname || `Guest ${user.id.slice(0, 4)}`;
                    const isHost = user.id === hostId;
                    const isSelf = user.id === selfId;
                    return (
                        <div
                            key={user.id}
                            className="relative shrink-0"
                            title={`${name}${isHost ? ' (Host)' : ''}${isSelf ? ' · You' : ''}`}
                        >
                            <img
                                src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${user.id}`}
                                alt={name}
                                className="w-7 h-7 rounded-full bg-[#0a0a12] ring-2 ring-black/80 group-hover:ring-brand-primary/40 transition-all"
                            />
                            {isHost && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#0a0a12] flex items-center justify-center">
                                    <FaCrown className="text-yellow-400 text-[6px]" />
                                </span>
                            )}
                        </div>
                    );
                })}
                {overflow > 0 && (
                    <div className="w-7 h-7 rounded-full bg-brand-primary/30 ring-2 ring-black/80 flex items-center justify-center text-[10px] font-bold text-white">
                        +{overflow}
                    </div>
                )}
            </div>
            <span className="text-[11px] font-semibold text-white/70 group-hover:text-white transition-colors tabular-nums">
                {participants.length}
            </span>
        </button>
    );
}

export default PeopleStrip;
