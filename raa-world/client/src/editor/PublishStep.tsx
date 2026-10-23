import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { copyText, formatDate, useFeedback } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { shareUrl } from '../pages/Dashboard.tsx';
import type { GameDoc, GameRecord } from '../../../shared/schema.ts';
import type { Issue } from '../../../shared/validation.ts';
import type { StepId } from './EditorPage.tsx';

const SECTION_LABEL: Record<Issue['section'], string> = {
  info: 'بيانات اللعبة',
  template: 'قالب اللعب',
  questions: 'الأسئلة',
  settings: 'إعدادات اللعب',
  look: 'المظهر والرسائل',
};

export function PublishStep({
  doc,
  record,
  issues,
  publishing,
  saveState,
  onPublish,
  onUnpublish,
  onPreview,
  onGo,
}: {
  doc: GameDoc;
  record: GameRecord;
  issues: Issue[];
  publishing: boolean;
  saveState: string;
  onPublish: () => void;
  onUnpublish: () => void;
  onPreview: () => void;
  onGo: (s: StepId) => void;
}) {
  const { toast, confirm } = useFeedback();
  const [qr, setQr] = useState<string | null>(null);
  const url = shareUrl(record.id);
  const everPublished = record.publishedVersion > 0;
  const ready = issues.length === 0;
  const changed = record.status === 'changed' || (record.status === 'live' && saveState !== 'saved');

  useEffect(() => {
    if (!everPublished) return;
    import('qrcode')
      .then((QR) => QR.toDataURL(url, { margin: 1, width: 360, color: { dark: '#0E1B3D', light: '#FFFFFF' } }))
      .then(setQr)
      .catch(() => setQr(null));
  }, [url, everPublished]);

  const unpublish = async () => {
    const ok = await confirm({
      title: 'إيقاف النشر',
      message: <p>لن تتمكن الطالبات من فتح اللعبة بالرابط حتى تعيدي نشرها. يبقى الرابط نفسه صالحًا بعد إعادة النشر.</p>,
      confirmLabel: 'إيقاف النشر',
    });
    if (ok) onUnpublish();
  };

  return (
    <div className="publish">
      <section className={`panel publish-status ${record.status}`}>
        <div className="publish-status-head">
          <span className="publish-icon">
            <Icon name={record.status === 'draft' ? 'edit' : record.status === 'paused' ? 'pause' : 'check'} size={24} />
          </span>
          <div>
            <h2>
              {record.status === 'draft' && 'اللعبة مسودة لم تُنشر بعد'}
              {record.status === 'live' && 'اللعبة منشورة ومتاحة للطالبات'}
              {record.status === 'changed' && 'اللعبة منشورة، ولديكِ تعديلات لم تُنشر'}
              {record.status === 'paused' && 'النشر موقوف مؤقتًا'}
            </h2>
            <p className="muted">
              {record.status === 'draft' && 'بعد النشر تحصلين على رابط ورمز QR لمشاركة اللعبة.'}
              {record.status === 'live' && `آخر نشر: ${formatDate(record.publishedAt)} · الإصدار ${record.publishedVersion}`}
              {record.status === 'changed' && 'الطالبات يلعبن النسخة المنشورة السابقة. انشري التعديلات لتصلهن.'}
              {record.status === 'paused' && 'الرابط لا يفتح اللعبة الآن. أعيدي النشر لإتاحتها من جديد بالرابط نفسه.'}
            </p>
          </div>
        </div>

        {!ready && (
          <div className="checklist">
            <h3>
              <Icon name="warn" size={18} /> قبل النشر، أكملي ما يلي:
            </h3>
            <ul>
              {issues.slice(0, 12).map((i, n) => (
                <li key={n}>
                  <button className="link-btn" onClick={() => onGo(i.section)}>
                    {SECTION_LABEL[i.section]}
                  </button>
                  : {i.message}
                </li>
              ))}
              {issues.length > 12 && <li>و{issues.length - 12} ملاحظات أخرى.</li>}
            </ul>
          </div>
        )}

        <div className="btn-row">
          {(record.status === 'draft' || changed || record.status === 'paused') && (
            <button className="btn primary lg" onClick={onPublish} disabled={!ready || publishing}>
              <Icon name="upload" />
              {publishing ? 'جارٍ النشر…' : record.status === 'draft' ? 'نشر اللعبة' : record.status === 'paused' ? (changed ? 'نشر التعديلات وإعادة الإتاحة' : 'إعادة النشر') : 'نشر التعديلات'}
            </button>
          )}
          <button className="btn outline lg" onClick={onPreview} disabled={doc.questions.length === 0}>
            <Icon name="eye" /> معاينة اللعبة كما ستراها الطالبة
          </button>
          {record.isPublished && (
            <button className="btn ghost danger-text" onClick={unpublish}>
              <Icon name="pause" /> إلغاء النشر
            </button>
          )}
        </div>
      </section>

      {everPublished && (
        <section className="panel share">
          <div className="share-main">
            <h2 className="panel-title">رابط اللعبة</h2>
            <p className="muted small">الرابط ثابت لهذه اللعبة، ويفتح على أي جهاز دون حساب.</p>
            <div className="share-link">
              <input className="input ltr" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="رابط اللعبة" />
              <button className="btn primary" onClick={async () => ((await copyText(url)) ? toast('نُسخ الرابط.') : toast('تعذّر النسخ تلقائيًا؛ انسخي الرابط يدويًا.', 'error'))}>
                <Icon name="copy" /> نسخ الرابط
              </button>
              <a className="btn outline" href={url} target="_blank" rel="noreferrer">
                <Icon name="external" /> فتح
              </a>
            </div>
            <ul className="share-tips">
              <li>أرسليه في مجموعة الفصل أو منصة مدرستي.</li>
              <li>اعرضي رمز QR على شاشة الفصل لتمسحه الطالبات بالجوال أو التابلت.</li>
              {doc.settings.recordResults ? (
                <li>
                  تسجيل النتائج مفعّل في المسودة. تابعي النتائج من <Link to={`/games/${record.id}/results`}>صفحة النتائج</Link>.
                </li>
              ) : (
                <li>تسجيل النتائج غير مفعّل. فعّليه من «إعدادات اللعب» إذا أردتِ متابعة الدرجات.</li>
              )}
            </ul>
          </div>
          <div className="share-qr">
            {qr ? <img src={qr} alt="رمز QR لرابط اللعبة" width={180} height={180} /> : <div className="qr-placeholder" />}
            {qr && (
              <a className="btn small ghost" href={qr} download={`QR - ${doc.meta.title || 'لعبة'}.png`}>
                <Icon name="download" size={16} /> تنزيل رمز QR
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
