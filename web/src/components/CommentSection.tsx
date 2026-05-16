import { FormEvent, useEffect, useRef, useState } from 'react';
import { Comment, addComment, fetchComments } from '../lib/api';

const NAME_KEY = 'la-galeria:name';

interface Props { uploadId: string }

export default function CommentSection({ uploadId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments(uploadId).then(({ comments }) => setComments(comments)).catch(() => {});
  }, [uploadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const b = text.trim();
    if (!n || !b) return;
    setSending(true);
    try {
      const { comment } = await addComment(uploadId, n, b);
      setComments((prev) => [...prev, comment]);
      setText('');
      localStorage.setItem(NAME_KEY, n);
    } catch { /* silent */ } finally { setSending(false); }
  }

  return (
    <div className="space-y-3">
      {comments.length === 0 && (
        <p className="text-ivory/50 text-sm">Sé la primera en comentar!</p>
      )}
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="bg-ivory/10 rounded-xl px-3 py-2">
            <span className="font-medium text-ivory text-sm">{c.name}</span>
            <span className="text-ivory/40 text-xs ml-2">
              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <p className="text-ivory/80 text-sm mt-0.5 break-words">{c.body}</p>
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>

      <form onSubmit={submit} className="space-y-2">
        {!name && (
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl bg-ivory/10 border border-ivory/20 text-ivory placeholder-ivory/40
                       px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose"
          />
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Añadir un comentario…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            className="flex-1 rounded-xl bg-ivory/10 border border-ivory/20 text-ivory placeholder-ivory/40
                       px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose"
          />
          <button
            type="submit"
            disabled={!text.trim() || !name.trim() || sending}
            className="bg-rose text-ivory rounded-xl px-4 py-2 text-sm font-medium
                       disabled:opacity-40 hover:bg-rose/80 transition"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
