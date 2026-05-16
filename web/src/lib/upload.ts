export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadTask {
  id: string;
  file: File;
  status: UploadStatus;
  progress: UploadProgress;
  error?: string;
}

export function newTask(file: File): UploadTask {
  return {
    id: crypto.randomUUID(),
    file,
    status: 'queued',
    progress: { loaded: 0, total: file.size, percent: 0 },
  };
}

export async function uploadOne(
  task: UploadTask,
  name: string,
  onUpdate: (next: UploadTask) => void,
): Promise<void> {
  function update(patch: Partial<UploadTask>) {
    Object.assign(task, patch);
    onUpdate({ ...task });
  }

  try {
    update({ status: 'uploading' });

    await postWithProgress('/api/upload', task.file, name, (loaded) => {
      const total = task.file.size;
      const percent = total ? Math.round((loaded / total) * 100) : 0;
      onUpdate({ ...task, progress: { loaded, total, percent } });
    });

    update({ status: 'done', progress: { loaded: task.file.size, total: task.file.size, percent: 100 } });
  } catch (e) {
    update({ status: 'error', error: e instanceof Error ? e.message : 'Upload failed' });
  }
}

function postWithProgress(
  url: string,
  file: File,
  uploaderName: string,
  onProgress: (loaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-Uploader-Name', uploaderName);
    xhr.setRequestHeader('X-Original-Filename', file.name);
    xhr.setRequestHeader('Content-Length', String(file.size));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(body.error || `Server error (${xhr.status})`));
        } catch {
          reject(new Error(`Server error (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.send(file);
  });
}

export async function uploadAll(
  files: File[],
  name: string,
  concurrency: number,
  onTaskUpdate: (task: UploadTask) => void,
): Promise<UploadTask[]> {
  const tasks = files.map(newTask);
  tasks.forEach(onTaskUpdate);

  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      await uploadOne(tasks[i], name, onTaskUpdate);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return tasks;
}
