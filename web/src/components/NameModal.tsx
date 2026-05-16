import { FormEvent, useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  initialName?: string;
  onSubmit: (name: string) => void;
  onClose?: () => void;
}

export default function NameModal({ open, initialName = '', onSubmit, onClose }: Props) {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initialName);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialName]);

  if (!open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-center justify-center bg-plum/30 backdrop-blur-sm px-5"
      onClick={onClose}
    >
      <form
        className="card w-full max-w-sm p-7 text-center"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-script text-5xl text-rose mb-1">Bienvenida</div>
        <h2 className="font-display text-xl text-plum mb-1">¡Nos alegra tenerte aquí!</h2>
        <p className="text-sm text-plum/60 mb-5">
          ¿Cómo te llamas? Aparecerá junto a las fotos y videos que subas.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Tu nombre"
          maxLength={60}
          className="w-full rounded-xl border border-rose/30 bg-blush/60 px-4 py-3 text-base text-plum
                     placeholder:text-plum/30
                     focus:outline-none focus:ring-2 focus:ring-rose/40"
        />
        <button type="submit" disabled={!value.trim()} className="btn-primary w-full mt-4">
          Continuar
        </button>
      </form>
    </div>
  );
}
