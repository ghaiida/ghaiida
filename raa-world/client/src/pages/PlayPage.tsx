// Public student page: /play/:id loads the published game; /demo/:sample plays a built-in example.
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.ts';
import { GamePlayer } from '../player/GamePlayer.tsx';
import { Logo, Spinner } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { SAMPLES, type SampleId } from '../../../shared/samples.ts';
import type { PlayPayload } from '../../../shared/schema.ts';

export default function PlayPage({ demo = false }: { demo?: boolean }) {
  const { id = '', sample = '' } = useParams();
  const [data, setData] = useState<PlayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const demoDoc = useMemo(() => (demo && sample in SAMPLES ? SAMPLES[sample as SampleId]() : null), [demo, sample]);

  useEffect(() => {
    if (demo) return;
    api<PlayPayload>(`/play/${encodeURIComponent(id)}`)
      .then((d) => {
        setData(d);
        document.title = `${d.doc.meta.title} | راء وورلد`;
      })
      .catch((e) => setError(e.message));
  }, [id, demo]);

  if (demo) {
    if (!demoDoc) return <PlayError message="هذه اللعبة التجريبية غير موجودة." />;
    return <GamePlayer doc={demoDoc} mode="demo" />;
  }
  if (error) return <PlayError message={error} />;
  if (!data) return <Spinner label="جارٍ تجهيز المغامرة…" />;
  return <GamePlayer doc={data.doc} mode="live" gameId={data.id} version={data.version} />;
}

function PlayError({ message }: { message: string }) {
  return (
    <div className="center-page">
      <Logo />
      <div className="empty">
        <span className="empty-icon">
          <Icon name="map" size={28} />
        </span>
        <h1 className="h3">تعذّر فتح اللعبة</h1>
        <p>{message}</p>
        <button className="btn outline" onClick={() => window.location.reload()}>
          <Icon name="refresh" /> إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
