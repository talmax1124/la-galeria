import { useEffect, useState } from 'react';
import { addReaction, fetchReactions } from '../lib/api';

const EMOJIS = ['❤️', '😂', '😮', '👏', '🔥'];
const LOCAL_KEY = 'la-galeria:reactions';

function getLocalReacted(): Record<string, Set<string>> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, new Set(v)]));
  } catch { return {}; }
}

function setLocalReacted(map: Record<string, Set<string>>) {
  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(Object.fromEntries(Object.entries(map).map(([k, v]) => [k, [...v]]))),
  );
}

interface Props { uploadId: string }

export default function ReactionBar({ uploadId }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const local = getLocalReacted();
    setReacted(local[uploadId] || new Set());
    fetchReactions(uploadId).then(({ counts }) => setCounts(counts)).catch(() => {});
  }, [uploadId]);

  async function react(emoji: string) {
    if (reacted.has(emoji)) return;
    try {
      const { counts: next } = await addReaction(uploadId, emoji);
      setCounts(next);
      const local = getLocalReacted();
      const set = local[uploadId] || new Set<string>();
      set.add(emoji);
      local[uploadId] = set;
      setLocalReacted(local);
      setReacted(new Set(set));
    } catch { /* silent */ }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji] || 0;
        const did = reacted.has(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => react(emoji)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition
              ${did
                ? 'bg-rose/30 border border-rose text-ivory'
                : 'bg-ivory/10 border border-ivory/20 text-ivory/70 hover:bg-ivory/20'}`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
