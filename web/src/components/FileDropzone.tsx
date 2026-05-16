import { DragEvent, useRef, useState } from 'react';

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileDropzone({ onFiles, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleSelected(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list).filter((f) => /^(image|video)\//.test(f.type));
    if (files.length) onFiles(files);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleSelected(e.dataTransfer.files);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`block rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${dragging ? 'border-rose bg-petal/40' : 'border-rose/30 bg-ivory/60 hover:bg-petal/30'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          handleSelected(e.target.files);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
      <div className="text-5xl mb-3" aria-hidden>
        🌸
      </div>
      <div className="font-display text-xl text-plum mb-1">Toca para añadir fotos o videos</div>
      <div className="text-sm text-plum/50">o arrástralos aquí · hasta 5 GB por archivo</div>
    </label>
  );
}
