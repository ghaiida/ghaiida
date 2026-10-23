// Picks an image, shrinks it in the browser, uploads it and returns the stored asset id.
import { useRef, useState } from 'react';
import { api, assetUrl } from '../api.ts';
import { Icon } from './Icon.tsx';

async function shrink(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('تعذّر فتح الصورة. جرّبي صورة PNG أو JPG.');
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  // Keep transparency for PNG logos; photos become compact JPEGs.
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.86));
  if (!blob) throw new Error('تعذّر تجهيز الصورة.');
  return blob;
}

export function ImagePicker({
  value,
  onChange,
  maxSide = 1200,
  label,
  shape = 'wide',
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  maxSide?: number;
  label: string;
  shape?: 'wide' | 'square';
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      setError('اختاري ملف صورة (PNG أو JPG أو WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('الصورة كبيرة جدًا (أكثر من ١٥ ميغابايت).');
      return;
    }
    setBusy(true);
    try {
      const blob = await shrink(file, maxSide);
      const { id } = await api<{ id: string }>('/assets', { raw: blob });
      onChange(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className={`image-picker ${shape}`}>
      {value ? (
        <div className="image-preview">
          <img src={assetUrl(value)} alt={label} />
          <div className="image-actions">
            <button type="button" className="btn small ghost" onClick={() => input.current?.click()} disabled={busy}>
              <Icon name="refresh" size={16} /> تغيير
            </button>
            <button type="button" className="btn small ghost danger-text" onClick={() => onChange(null)} disabled={busy}>
              <Icon name="trash" size={16} /> إزالة
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="image-drop" onClick={() => input.current?.click()} disabled={busy}>
          <Icon name={busy ? 'refresh' : 'image'} size={24} className={busy ? 'spin' : ''} />
          <span>{busy ? 'جارٍ رفع الصورة…' : label}</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
