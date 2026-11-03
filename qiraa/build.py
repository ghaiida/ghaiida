#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""يولّد كتاب «سُلَّم القراءة» كملف HTML جاهز للطباعة (A4).

الاستخدام:
    python3 qiraa/build.py            # يكتب qiraa.html في جذر المستودع
    node qiraa/pdf.js                 # يحوّله إلى PDF
"""
import html
import random
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from content import *  # noqa: E402,F403

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "qiraa.html"

HARAKAT = set(chr(c) for c in range(0x064B, 0x0653)) | {"ٰ"}
NONCONN = set("اأإآدذرزوؤةىء")
TAT = "ـ"
PIECE_COLORS = 5
AR_DIGITS = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")


def ar(n):
    return str(n).translate(AR_DIGITS)


def esc(s):
    return html.escape(s, quote=False)


def bases(s):
    return [c for c in s if c not in HARAKAT and c not in "{}"]


def connects_forward(piece):
    b = bases(piece)
    return bool(b) and b[-1] not in NONCONN


def can_receive(piece):
    b = bases(piece)
    return bool(b) and b[0] != "ء"


def markup(s, cls=None):
    """يحوّل {ل} إلى حرف باهت (يُكتب ولا يُنطق)."""
    out, buf, silent = [], "", False
    for ch in s:
        if ch == "{":
            if buf:
                out.append(esc(buf))
            buf, silent = "", True
        elif ch == "}":
            out.append(f'<span class="silent">{esc(buf)}</span>')
            buf, silent = "", False
        else:
            buf += ch
    if buf:
        out.append(esc(buf))
    inner = "".join(out)
    return f'<span class="{cls}">{inner}</span>' if cls else inner


def plain(s):
    return s.replace("{", "").replace("}", "")


def split(word):
    return word.split(" ")


def joined(pieces, upto=None, colored=True, tail=True):
    """يجمع المقاطع في كلمة واحدة، كل مقطع بلونه، مع ـ في آخره إن كان سيتصل بما بعده."""
    n = len(pieces)
    upto = n if upto is None else upto
    parts = []
    for i in range(upto):
        cls = f"p{i % PIECE_COLORS}" if colored else None
        txt = pieces[i]
        if tail and i == upto - 1 and upto < n and connects_forward(pieces[i]) and can_receive(pieces[i + 1]):
            txt += TAT
        parts.append(markup(txt, cls))
    return "".join(parts)


def piece_form(pieces, i):
    """المقطع منفردًا بالشكل الذي يظهر به داخل الكلمة (بـ / ـبـ / ـب)."""
    p = pieces[i]
    pre = TAT if i > 0 and connects_forward(pieces[i - 1]) and can_receive(p) else ""
    post = TAT if i < len(pieces) - 1 and connects_forward(p) and can_receive(pieces[i + 1]) else ""
    if pre and p.startswith("ا{"):
        pre = ""
    return markup(pre + p + post, f"p{i % PIECE_COLORS}")


# ---------------------------------------------------------------------------
# مكوّنات الصفحة
# ---------------------------------------------------------------------------
STAGES = {
    0: ("", ""),
    1: ("المرحلة ١", "الحروف مع الفتحة"),
    2: ("المرحلة ٢", "الضمة والكسرة"),
    3: ("المرحلة ٣", "التنوين"),
    4: ("المرحلة ٤", "السكون"),
    5: ("المرحلة ٥", "المدود"),
    6: ("المرحلة ٦", "الشدة"),
    7: ("المرحلة ٧", "ال والحروف الخاصة"),
    8: ("المرحلة ٨", "الجمل والقصص"),
}

pages = []


def page(stage, title, body, extra_cls=""):
    st_num, st_name = STAGES[stage]
    head = ""
    if title:
        pill = f'<span class="pill">{st_num} — {st_name}</span>' if stage else ""
        head = f'<header class="ph"><h2>{title}</h2>{pill}</header>'
    num = len(pages) + 1
    pages.append(
        f'<section class="page st{stage} {extra_cls}">{head}<div class="pb">{body}</div>'
        f'<footer class="pf"><span class="pn">{ar(num)}</span></footer></section>'
    )


def sec(icon, title, body, cls=""):
    return f'<div class="sec {cls}"><h3><span class="ic">{icon}</span>{title}</h3>{body}</div>'


def tip(text, icon="💡", who="لولي الأمر"):
    return f'<div class="tip"><b>{icon} {who}:</b> {text}</div>'


def stars(n=3):
    return '<span class="stars">' + "☆" * n + "</span>"


def ladder(word, size="m", final=None):
    ps = split(word)
    rows, step = [], 0
    for i in range(len(ps)):
        step += 1
        rows.append(f'<div class="st piece" style="--i:{step}"><span class="n">{ar(step)}</span><span class="w">{piece_form(ps, i)}</span></div>')
        if i >= 1:
            step += 1
            last = i == len(ps) - 1
            content = markup(final, "fw") if (last and final) else joined(ps, i + 1)
            cls = "final" if last else "join"
            badge = "⭐" if last else ar(step)
            rows.append(f'<div class="st {cls}" style="--i:{step}"><span class="n">{badge}</span><span class="w">{content}</span></div>')
    return f'<div class="ladder sz-{size}">{"".join(rows)}</div>'


def sentence_ladder(emo, words):
    rows = []
    for k in range(1, len(words) + 1):
        cur = " ".join(markup(words[j], f"p{j % PIECE_COLORS}") for j in range(k))
        cls = "final" if k == len(words) else "join"
        badge = "⭐" if k == len(words) else ar(k)
        rows.append(f'<div class="st {cls}" style="--i:{k}"><span class="n">{badge}</span><span class="w">{cur}</span></div>')
    return f'<div class="sladder"><div class="semo">{emo}</div>{"".join(rows)}</div>'


def pills(words, review=()):
    out = []
    for w in words:
        out.append(f'<div class="wp"><span class="ar">{markup(plain(w) if " " not in w else "".join(split(w)))}</span>{stars()}</div>')
    for w in review:
        out.append(f'<div class="wp rv"><span class="tag">مراجعة</span><span class="ar">{"".join(split(w))}</span>{stars()}</div>')
    return f'<div class="pills">{"".join(out)}</div>'


def train(sylls):
    cars = "".join(f'<div class="car"><span class="ar">{esc(s)}</span><i></i><i></i></div>' for s in sylls)
    return f'<div class="train"><div class="loco">🚂</div>{cars}</div>'


def card(spec, show_plus=True):
    parts = spec.split("|")
    word, emo = parts[0], parts[1]
    final = parts[2] if len(parts) > 2 else None
    ps = split(word)
    chips = '<span class="plus">+</span>'.join(f'<span class="chip">{piece_form(ps, i)}</span>' for i in range(len(ps)))
    chips_cls = f"n{len(ps)}"
    big = markup(final, "fw") if final else joined(ps)
    return (f'<div class="card"><div class="cemo">{emo}</div><div class="cbody">'
            f'<div class="chips {chips_cls}">{chips}</div><div class="cword">{big}</div>{stars()}</div></div>')


def forms_of(L):
    if L in NONCONN:
        fs = [("وحده", L), ("في الآخر", TAT + L)]
    else:
        fs = [("وحده", L), ("في الأول", L + TAT), ("في الوسط", TAT + L + TAT), ("في الآخر", TAT + L)]
    return '<div class="forms">' + "".join(f'<div class="fm"><span class="ar">{f}</span><small>{n}</small></div>' for n, f in fs) + "</div>"


def find_grid(L, seed):
    rnd = random.Random(seed)
    sim = list(SIMILAR.get(L, "بتن"))
    others = [x for x in "بتجدرسصطعفكلمنهو" if x != L and x not in sim]
    pool = [rnd.choice(sim) for _ in range(5)] + rnd.sample(others, 2)
    cells = [L] * 5 + pool
    rnd.shuffle(cells)
    return '<div class="find">' + "".join(f'<span class="ar">{c}</span>' for c in cells) + "</div>"


def trace(L, haraka="َ"):
    tr = "".join(f'<span class="tr ar">{L}{haraka}</span>' for _ in range(4))
    boxes = "".join('<span class="box"></span>' for _ in range(3))
    return f'<div class="trace">{tr}{boxes}</div>'


# ---------------------------------------------------------------------------
# الصفحات
# ---------------------------------------------------------------------------
def cover():
    steps = [("رَ", "p0"), ("سَ", "p1"), ("رَسَـ", None), ("مَ", "p2"), ("رَسَمَ", None)]
    st = ""
    for i, (t, c) in enumerate(steps):
        inner = (f'<span class="{c}">{t}</span>' if c else
                 ('<span class="p0">رَ</span><span class="p1">سَـ</span>' if i == 2 else
                  '<span class="p0">رَ</span><span class="p1">سَ</span><span class="p2">مَ</span>'))
        st += f'<div class="cs" style="--i:{i}"><span class="ar">{inner}</span></div>'
    body = f"""
    <div class="cv-top"><span class="cv-badge">كتاب الطفل الأول في القراءة</span></div>
    <h1 class="cv-title">سُلَّمُ الْقِرَاءَةِ</h1>
    <p class="cv-sub">مِنَ الْحَرْفِ … إِلَى الْكَلِمَةِ … إِلَى الْجُمْلَةِ<br><small>طريقة البناء التراكمي — درجة درجة</small></p>
    <div class="cv-stairs">{st}<div class="cv-kid">🧒</div><div class="cv-star">⭐</div></div>
    <div class="cv-name">بطل القراءة: <span></span></div>
    <div class="cv-stages">{''.join(f'<span class="cvs st{i}">{STAGES[i][1]}</span>' for i in range(1, 9))}</div>
    """
    page(0, "", body, "cover")


def guide():
    body = """
    <p class="lead">هذا الكتاب مبنيّ على <b>طريقة البناء التراكمي</b>: نقرأ الحرف الأول، ثم الثاني، ثم نجمعهما،
    ثم نضيف الثالث ونقرأ الكلمة كاملة. الطفل لا يحفظ الكلمة شكلًا، بل <b>يبنيها بنفسه صوتًا صوتًا</b> —
    ولهذا يستطيع بعدها قراءة أي كلمة جديدة.</p>
    <div class="demo">""" + ladder("رَ سَ مَ", "s") + """<div class="demo-txt">
      <b>هكذا نصعد السُّلَّم:</b>
      <ol><li>اقرأ المقطع الأول: «رَ»</li><li>اقرأ المقطع الثاني: «سَ»</li><li>اجمعهما: «رَسَ»</li>
      <li>اقرأ الثالث: «مَ»</li><li>اقرأ الكلمة كاملة: «رَسَمَ» ⭐</li></ol>
      <p>كل حرف له لون ثابت داخل السُّلَّم، ليرى الطفل أين ذهب كل صوت داخل الكلمة.</p></div></div>
    <h3 class="gh">🌟 عشر قواعد ذهبية</h3>
    <div class="rules">
      <div><b>١. الصوت لا الاسم:</b> نقول «بَ» وليس «باء». اسم الحرف لا يساعد على القراءة، صوته هو المفتاح.</div>
      <div><b>٢. قليل كل يوم:</b> ١٥–٢٠ دقيقة يوميًا أفضل بكثير من ساعة مرة في الأسبوع.</div>
      <div><b>٣. الإصبع القارئ:</b> يضع الطفل إصبعه تحت كل مقطع وهو يقرؤه.</div>
      <div><b>٤. مُدّ ثم اجمع:</b> «رَ… سَ… رَسَ» ببطء، ثم أسرع حتى تنطلق الكلمة.</div>
      <div><b>٥. الإتقان قبل الانتقال:</b> ننتقل للحرف التالي عندما يقرأ كلمات الدرس وحده بلا مساعدة.</div>
      <div><b>٦. المراجعة أولًا:</b> كل جلسة تبدأ بكلمات الأمس.</div>
      <div><b>٧. المعنى مهم:</b> بعد كل كلمة: «ماذا تعني؟ مثّلها لي!».</div>
      <div><b>٨. اكتب ما تقرأ:</b> يكتب الكلمة في دفتره بعد قراءتها، فتثبت في ذهنه.</div>
      <div><b>٩. لا تقرأ عنه:</b> إن تعثّر عُد درجة واحدة على السُّلَّم، ولا تقل الكلمة كاملة.</div>
      <div><b>١٠. احتفل بكل نجاح:</b> نجمة، تصفيق، «أنت بطل!» — الحماس نصف التعلّم.</div>
    </div>"""
    page(0, "📘 دليل ولي الأمر: كيف نستخدم هذا الكتاب؟", body, "guide")

    body = """
    <h3 class="gh">⏱️ الجلسة اليومية (١٥–٢٠ دقيقة)</h3>
    <div class="routine">
      <div><span>١</span><b>إحماء</b><small>دقيقتان</small><p>قراءة كلمات الأمس من الكتاب أو البطاقات.</p></div>
      <div><span>٢</span><b>صوت جديد</b><small>٣ دقائق</small><p>صفحة «تعرّف على الحرف»: الصوت، الصورة، الأشكال.</p></div>
      <div><span>٣</span><b>اصعد السُّلَّم</b><small>٥ دقائق</small><p>بناء الكلمات مقطعًا مقطعًا بالإصبع.</p></div>
      <div><span>٤</span><b>اقرأ الكلمات</b><small>٣ دقائق</small><p>كلمات الدرس + كلمات المراجعة، ولوّن النجوم.</p></div>
      <div><span>٥</span><b>اكتب والعب</b><small>٣ دقائق</small><p>تتبّع الحرف، ابحث عنه، اكتب كلمة في الدفتر.</p></div>
      <div><span>٦</span><b>احتفال</b><small>دقيقة</small><p>لوّن الحرف في «لوحة رحلتي» 🎉</p></div>
    </div>
    <h3 class="gh">🗺️ خطة زمنية مقترحة (اتبع سرعة طفلك)</h3>
    <table class="plan">
      <tr><th>الفترة</th><th>المرحلة</th><th>النتيجة المتوقعة</th></tr>
      <tr><td>الأسبوع ١</td><td>أول ٣–٦ حروف بالفتحة</td><td>يقرأ أول كلمة بنفسه: «رَسَمَ» 🎉</td></tr>
      <tr><td>الأسابيع ٢–٥</td><td>باقي الحروف بالفتحة (حرف كل يوم)</td><td>يقرأ أكثر من ٧٠ كلمة ثلاثية</td></tr>
      <tr><td>الأسبوع ٦</td><td>الضمة والكسرة</td><td>يميّز الحركات الثلاث بسرعة</td></tr>
      <tr><td>الأسبوع ٧</td><td>التنوين + الياء</td><td>يقرأ أسماء الأشياء من حوله</td></tr>
      <tr><td>الأسبوع ٨</td><td>السكون</td><td>يقرأ: كَلْبٌ، شَمْسٌ، يَلْعَبُ</td></tr>
      <tr><td>الأسبوع ٩</td><td>المدود ا و ي</td><td>يقرأ: بَابٌ، فِيلٌ، نُورٌ</td></tr>
      <tr><td>الأسبوع ١٠</td><td>الشدة</td><td>يقرأ: دُبٌّ، سُكَّرٌ، مُعَلِّمٌ</td></tr>
      <tr><td>الأسبوع ١١</td><td>ة ، ال ، ء ، ى</td><td>يقرأ: الشَّمْسُ، شَجَرَةٌ</td></tr>
      <tr><td>الأسبوع ١٢</td><td>الجمل والقصص</td><td>يقرأ قصة قصيرة كاملة 📖</td></tr>
    </table>
    <div class="note">
      <b>📌 ملاحظات من الخبرة:</b>
      <ul>
        <li>بعض الأطفال أسرع من هذه الخطة بكثير — إن أتقن حرفين في يوم فانطلقوا.</li>
        <li>الحروف المتشابهة (ب ت ث ن) و(ج ح خ) و(د ذ) و(ر ز): ركّز على <b>عدد النقاط ومكانها</b>.</li>
        <li>إن لاحظت تعبًا أو مللًا: توقّف فورًا واختم بشيء سهل يتقنه. الجلسة القصيرة السعيدة أنجح.</li>
        <li>في آخر الكتاب <b>بطاقات حروف للقص</b>: ابنِ بها كلمات على الطاولة كأنها لعبة مكعبات.</li>
      </ul>
    </div>"""
    page(0, "📘 دليل ولي الأمر: الجلسة اليومية والخطة", body, "guide")


def journey():
    order = [l[0] for l in LESSONS] + ["ي"]
    dots = "".join(f'<div class="jd"><span class="ar">{L}</span><small>{ar(i + 1)}</small></div>' for i, L in enumerate(order))
    badges = "".join(f'<div class="jb st{i}"><span>{ar(i)}</span>{STAGES[i][1]}<em>☆</em></div>' for i in range(1, 9))
    body = f"""
    <p class="lead center">كلما أتقنتَ حرفًا لوّنْ دائرته 🖍️ — وكلما أنهيتَ مرحلة لوّنْ نجمتها ⭐</p>
    <div class="jgrid">{dots}</div>
    <h3 class="gh center">مراحل الرحلة</h3>
    <div class="jbadges">{badges}</div>
    <div class="jfinish">🏆 في نهاية الرحلة: شهادة «بطل القراءة»!</div>"""
    page(0, "🗺️ لوحة رحلتي", body, "journey")


def stage1_intro():
    body = f"""
    <div class="banner"><span class="bnum">١</span><div><h1>الحروف مع الفتحة</h1><p>نتعلّم صوت كل حرف، ونبني به كلمات حقيقية من أول أسبوع</p></div></div>
    <div class="hk-row">
      <div class="hk"><div class="hk-mark ar">ـَ</div><b>الفتحة</b><p>خطّ صغير <u>فوق</u> الحرف</p></div>
      <div class="hk"><div class="hk-emo">😮</div><b>افتح فمك</b><p>نقول: أَ</p></div>
      <div class="hk"><div class="hk-emo">✋⬆️</div><b>حركة اليد</b><p>ارفع يدك للأعلى مع كل فتحة</p></div>
    </div>
    <div class="eq"><span class="ar p1">ب</span><span class="op">+</span><span class="ar p0">ـَ</span><span class="op">=</span><span class="ar big">بَ</span></div>
    {sec("🪜", "طريقتنا: نصعد السُّلَّم", '<div class="demo2">' + ladder("رَ سَ مَ", "s") + ladder("كَ تَ بَ", "s") + "</div>")}
    {tip("في هذه المرحلة نعلّم <b>صوت الحرف مع الفتحة فقط</b>. ترتيب الحروف ليس ترتيب الأبجدية، بل اخترناه بحيث يصنع كل حرف جديد كلمات حقيقية مع الحروف التي سبقته — فيشعر الطفل بالنجاح من الدرس الثالث.")}
    """
    page(1, "", body, "intro")


def lesson_pages(idx, L, name, pic, emo, words, ptip, stage=1, sylls=None, learned=None, prev_words=None):
    num = ar(idx)
    sylls = sylls or [L + "َ"]
    first = pic[0]
    rest = pic[1:]
    k = 1
    while k <= len(rest) and rest[:k] and all(c in HARAKAT for c in rest[:k]):
        k += 1
    hl = first + rest[:k - 1]
    pic_html = f'<span class="hl">{esc(hl)}</span>{esc(rest[k - 1:])}'
    syl_html = "".join(f'<span class="ar sy">{s}</span>' for s in sylls)
    body = f"""
    <div class="hero">
      <div class="bigL"><span class="ar">{L}</span><small>حرف {name}</small></div>
      <div class="picc"><div class="pemo">{emo}</div><div class="pword ar">{pic_html}</div><small>تبدأ بصوت <b class="ar">{sylls[0]}</b></small></div>
    </div>
    <div class="row2">
      {sec("🔊", "صوت الحرف", f'<div class="sound">{syl_html}</div><p class="say">قُل الصوت وأنت تشير إليه، لا اسم الحرف</p>', "snd")}
      {sec("🔤", "أشكال الحرف في الكلمة", forms_of(L), "frm")}
    </div>
    {sec("🔍", f"ابحث عن الحرف <b class='ar'>{L}</b> ولوّنه", find_grid(L, idx * 7 + ord(L)))}
    {sec("✏️", "تتبّع ثم اكتب", trace(L, sylls[0][1:] if len(sylls[0]) > 1 else ""))}
    {tip(ptip, "🗣️", "نطق الحرف")}
    """
    page(stage, f'<span class="ln">الدرس {num}</span> تعرّف على حرف <span class="ar tl">{L}</span>', body, "lessonA")

    if stage != 1:
        return
    # ---- الصفحة ب: ابنِ واقرأ
    rnd = random.Random(idx * 13)
    learned = learned or []
    tsyl = [L + "َ"] * 3 + [x + "َ" for x in rnd.sample(learned, min(6, len(learned)))]
    rnd.shuffle(tsyl)
    parts = []
    if words:
        lads = "".join(ladder(w, "l" if len(words) == 1 else "m") for w in words[:2])
        title = "🎉 أول كلمة تقرؤها وحدك!" if idx == 3 else "اصعد السُّلَّم واقرأ الكلمة"
        parts.append(sec("🪜", title, f'<div class="lads n{min(len(words), 2)}">{lads}</div>'))
        review = rnd.sample(prev_words, min(4, len(prev_words))) if prev_words else []
        parts.append(sec("📖", "اقرأ الكلمات ولوّن نجمة كل مرة", pills(words, review)))
    else:
        g = SOUND_GAME[L]
        cells = "".join(f'<div class="sg"><div class="pemo">{e}</div><span class="ar">{w}</span></div>' for w, e, _ in g)
        parts.append(sec("👂", f"أيّ صورة يبدأ اسمها بصوت <b class='ar'>{L}َ</b>؟ ضع دائرة حولها", f'<div class="sgame">{cells}</div>'))
        mirror = ('<div class="mirror"><div class="hk-emo">🪞</div><div>قِفا أمام المرآة: قل «' + L + 'َ» وانظر إلى فمك، ثم يقلّدك طفلك. '
                  'ابحثا في البيت عن ٣ أشياء تبدأ بصوت «' + L + 'َ».</div></div>')
        if idx == 1:
            parts.append(sec("🪞", "لعبة المرآة", mirror))
        big = "".join(f'<span class="tr ar">{L}َ</span>' for _ in range(6))
        parts.append(sec("✏️", "تتبّع بإصبعك ثم بالقلم", f'<div class="bigtrace">{big}</div>'))
        if idx == 2:
            parts.append(sec("🔗", "اقرأ المقطعين", '<div class="pairs">' + "".join(f'<span class="ar">{a}</span>' for a in ["مَ رَ", "رَ مَ", "رَ رَ", "مَ مَ"]) + "</div>"))
    parts.append(sec("🚂", "قطار المقاطع: اقرأ بسرعة", train(tsyl)))
    parts.append(tip(GENERAL_TIPS[idx % len(GENERAL_TIPS)]))
    page(1, f'<span class="ln">الدرس {num}</span> ابنِ واقرأ', "".join(parts), "lessonB")


def review_page(n, words, learned):
    cells = "".join(f'<div class="rw"><span class="ar">{"".join(split(w))}</span>{stars()}</div>' for w in words)
    lets = "".join(f'<span class="ar">{x}َ</span>' for x in learned)
    body = f"""
    <p class="lead center">محطة استراحة! اقرأ كل كلمة، ولوّن نجمة 🌟 في كل مرة تقرؤها صحيحة.</p>
    <div class="rgrid">{cells}</div>
    {sec("🔤", "كل الأصوات التي تعرفها الآن", f'<div class="allL">{lets}</div>')}
    <div class="challenge"><div>⏱️ <b>تحدّي الدقيقة:</b> كم كلمة تقرأ في دقيقة واحدة؟</div>
    <div class="tries"><span>المحاولة ١: ____</span><span>المحاولة ٢: ____</span><span>المحاولة ٣: ____</span></div></div>
    {tip("لا تنتقل للدروس التالية حتى يقرأ ٨٠٪ من كلمات المحطة وحده. ارجع للدرس الذي فيه كلمات صعبة وأعد السُّلَّم.")}
    """
    page(1, f"🚉 محطة المراجعة {n}", body, "review")


def stage2():
    body = f"""
    <div class="banner"><span class="bnum">٢</span><div><h1>الضمة والكسرة</h1><p>الحرف نفسه… ثلاثة أصوات!</p></div></div>
    <div class="hk-row three">
      <div class="hk c0"><div class="hk-mark ar">بَ</div><b>الفتحة ـَ</b><div class="hk-emo">😮</div><p>فوق الحرف ، افتح فمك<br>ارفع يدك ⬆️</p></div>
      <div class="hk c1"><div class="hk-mark ar">بُ</div><b>الضمة ـُ</b><div class="hk-emo">😗</div><p>واو صغيرة فوق ، اضمم شفتيك<br>أشر للأمام ➡️</p></div>
      <div class="hk c2"><div class="hk-mark ar">بِ</div><b>الكسرة ـِ</b><div class="hk-emo">😁</div><p>تحت الحرف ، ابتسم<br>أنزل يدك ⬇️</p></div>
    </div>
    {sec("🎵", "غنِّها معًا", '<div class="sing">' + "".join(f'<span class="ar">{x}</span>' for x in ["بَ بُ بِ", "مَ مُ مِ", "سَ سُ سِ", "رَ رُ رِ", "كَ كُ كِ", "لَ لُ لِ"]) + "</div>")}
    {sec("🪜", "نفس السُّلَّم… بحركات جديدة", '<div class="lads n3">' + ladder("عَ لِ مَ", "s") + ladder("كَ بُ رَ", "s") + ladder("شَ رِ بَ", "s") + "</div>")}
    {tip("اجعلوها لعبة: يقول الطفل الصوت ويحرّك يده مع الحركة (أعلى للفتحة، أمام للضمة، أسفل للكسرة). الحركة الجسدية تثبّت الفرق في ذاكرته.")}
    """
    page(2, "", body, "intro")

    order = [l[0] for l in LESSONS]
    rows = ""
    for i in range(0, len(order), 2):
        cells = ""
        for L in order[i:i + 2]:
            cells += f'<div class="hrow"><span class="ar">{L}َ</span><span class="ar">{L}ُ</span><span class="ar">{L}ِ</span></div>'
        rows += f'<div class="hline">{cells}</div>'
    page(2, "⚡ اقرأ بسرعة: كل حرف بثلاث حركات", f'<div class="hgrid">{rows}</div>' + tip("اقرأ صفًا كل يوم في بداية الجلسة. عندما يقرأ الصفحة كلها في أقل من دقيقتين فهو جاهز للكلمات."), "grid")

    for k in range(0, len(KASRA_WORDS), 6):
        lads = "".join(ladder(w, "s") for w in KASRA_WORDS[k:k + 6])
        page(2, "🪜 كلمات فيها كسرة ـِ", f'<div class="lads6">{lads}</div>' + tip("اسأله بعد كل كلمة: «أين الكسرة؟» ليضع إصبعه تحتها."))
    lads = "".join(ladder(w, "s") for w in DAMMA_WORDS)
    page(2, "🪜 كلمات فيها ضمة ـُ", f'<div class="lads6">{lads}</div>' + tip("كلمات الضمة هنا تعني الصفات: كَبُرَ (صار كبيرًا)، صَغُرَ (صار صغيرًا). مثّلها بيديك!"))

    rows = "".join(
        f'<div class="grow"><span class="gn">{ar(i + 1)}</span>' + "".join(f'<span class="ar opt">{o}</span>' for o in r.split()) + "</div>"
        for i, r in enumerate(HARAKA_GAME))
    allw = KASRA_WORDS + DAMMA_WORDS
    body = sec("👂", "اسمع وحوّط: يقول ولي الأمر صوتًا واحدًا من كل صف", f'<div class="hgame">{rows}</div>') + \
        sec("📖", "اقرأ كلمات المرحلة", pills(allw[:12]))
    page(2, "🎯 لعبة الأذن الذكية", body)


def stage3():
    L, name, pic, emo, words, ptip = YA
    lesson_pages(28, L, name, pic, emo, words, ptip, stage=3, sylls=["يَ", "يُ", "يِ"])
    body = f"""
    <div class="banner"><span class="bnum">٣</span><div><h1>التنوين</h1><p>حركتان معًا = الحركة + صوت «نْ» مخفي</p></div></div>
    <div class="tw">
      <div class="twc c1"><span class="ar big">بٌ</span><b>تنوين الضم ـٌ</b><span class="ar">بٌ = بُنْ</span></div>
      <div class="twc c0"><span class="ar big">بًا</span><b>تنوين الفتح ـً</b><span class="ar">بًا = بَنْ</span></div>
      <div class="twc c2"><span class="ar big">بٍ</span><b>تنوين الكسر ـٍ</b><span class="ar">بٍ = بِنْ</span></div>
    </div>
    <div class="tw-ex"><span class="ar">قَمَرٌ</span><span class="ar">قَمَرًا</span><span class="ar">قَمَرٍ</span></div>
    <p class="say center">نقرؤها: قَمَرُنْ ، قَمَرَنْ ، قَمَرِنْ — النون نسمعها ولا نكتبها!</p>
    {sec("🪜", "اصعد السُّلَّم", '<div class="lads n3">' + ladder("أَ سَ دٌ", "m") + ladder("وَ لَ دٌ", "m") + ladder("يَ دٌ", "m") + "</div>")}
    {tip("تنوين الفتح يأتي غالبًا مع ألف بعده لا تُقرأ: قَمَرًا. علّمه: «الألف هنا صامتة، تحمل التنوين فقط».")}
    """
    page(3, "", body, "intro")
    for k in range(0, len(TANWEEN_CARDS), 6):
        cards = "".join(card(c) for c in TANWEEN_CARDS[k:k + 6])
        page(3, "🖼️ اقرأ الكلمة وانظر إلى الصورة", f'<div class="cards">{cards}</div>' + tip("غطِّ الصورة بيدك أولًا، ودعه يقرأ ثم يكشف الصورة ليتأكد بنفسه — هذا يمنع التخمين من الصورة."))


def stage4():
    small = "".join(ladder(w, "xs") for w in SUKUN_SMALL)
    body = f"""
    <div class="banner"><span class="bnum">٤</span><div><h1>السكون</h1><p>الحرف الساكن «ينام» ويلتصق بالحرف الذي قبله</p></div></div>
    <div class="hk-row">
      <div class="hk"><div class="hk-mark ar">ـْ</div><b>السكون</b><p>دائرة صغيرة فوق الحرف</p></div>
      <div class="hk"><div class="hk-emo">😴</div><b>الحرف نائم</b><p>لا نفتح ولا نضم ولا نكسر</p></div>
      <div class="hk"><div class="hk-emo">🤝</div><b>يلتصق</b><p>أَ + بْ = أَبْ</p></div>
    </div>
    {sec("🪜", "كلمات قصيرة نستعملها كل يوم", f'<div class="lads8">{small}</div>')}
    {tip("المقطع الساكن يُقرأ <b>دفعة واحدة</b>: «مَنْ» وليس «مَ… نْ». بعد هذه الصفحة نقسم الكلمات إلى قطع مثل: تَمْ + رٌ.")}
    """
    page(4, "", body, "intro")
    for k in range(0, len(SUKUN_CARDS), 6):
        cards = "".join(card(c) for c in SUKUN_CARDS[k:k + 6])
        page(4, "🖼️ قطعة + قطعة = كلمة", f'<div class="cards">{cards}</div>' + tip("اقرأ القطعة الأولى كاملة «كَلْ» ثم الثانية «بٌ» ثم اجمعهما «كَلْبٌ». هكذا تُقرأ أي كلمة طويلة."))
    lads = "".join(ladder(w, "s") for w in SUKUN_VERBS)
    page(4, "🪜 أفعال يفعلها الطفل كل يوم", f'<div class="lads6">{lads}</div>' + tip("بعد قراءة الفعل اطلب منه أن يمثّله: يَلْعَبُ، يَكْتُبُ، يَشْرَبُ… لعبة «اقرأ ومثّل» يحبها الأطفال كثيرًا!"))


def stage5():
    rows = "".join(
        f'<span class="ar">{L}َا</span><span class="ar">{L}ُو</span><span class="ar">{L}ِي</span>'
        for L in MADD_LETTERS)
    body = f"""
    <div class="banner"><span class="bnum">٥</span><div><h1>المدود: ا و ي</h1><p>حروف تمدّ الصوت مثل صفّارة القطار 🚂 «بااااا»</p></div></div>
    <div class="tw">
      <div class="twc c0"><span class="ar big">بَا</span><b>فتحة + ا</b><span>مدّ الفتحة</span></div>
      <div class="twc c1"><span class="ar big">بُو</span><b>ضمة + و</b><span>مدّ الضمة</span></div>
      <div class="twc c2"><span class="ar big">بِي</span><b>كسرة + ي</b><span>مدّ الكسرة</span></div>
    </div>
    {sec("⚡", "اقرأ ومُدّ صوتك", f'<div class="mgrid">{rows}</div>')}
    """
    page(5, "", body, "intro")
    for k in range(0, len(MADD_CARDS), 6):
        cards = "".join(card(c) for c in MADD_CARDS[k:k + 6])
        page(5, "🖼️ كلمات ممدودة", f'<div class="cards">{cards}</div>' + tip("حرف المدّ لا يأخذ حركة، فهو «يكمل» حركة الحرف الذي قبله ويطيلها."))
    lads = "".join(ladder(w, "s") for w in MADD_VERBS)
    page(5, "🪜 اصعد السُّلَّم", f'<div class="lads6">{lads}</div>' + tip("قارن معه: نَمَ / نَامَ — قَلَ / قَالَ. ليسمع الفرق بين الصوت القصير والطويل."))


def stage6():
    split_html = "".join(f'<div class="sp"><span class="ar">{w}</span><span class="eqs">=</span><span class="ar sm">{s}</span></div>' for w, s in SHADDA_SPLIT)
    body = f"""
    <div class="banner"><span class="bnum">٦</span><div><h1>الشدة ـّ</h1><p>الشدة = الحرف مرتين: الأول ساكن والثاني متحرك</p></div></div>
    <div class="eq"><span class="ar p0">دُبْ</span><span class="op">+</span><span class="ar p1">بٌ</span><span class="op">=</span><span class="ar big">دُبٌّ</span></div>
    {sec("🔍", "فكّ الشدة", f'<div class="splits">{split_html}</div>')}
    {sec("📖", "اقرأ الكلمات", pills(SHADDA_WORDS))}
    {tip("الشدة تشبه رقم ٣ صغير (ـّ) فوق الحرف. علّمه أن يضغط على الحرف: «دُبْ‑بٌ» كأنه يقفز عليه مرتين.")}
    """
    page(6, "", body, "intro")
    cards = "".join(card(c) for c in SHADDA_CARDS)
    page(6, "🖼️ كلمات فيها شدة", f'<div class="cards">{cards}</div>' + tip("القطع الصغيرة فوق كل كلمة تُظهر الحرف المشدد مكتوبًا مرتين. بعد التمرين يقرأ الكلمة مباشرة."))


def stage7():
    body = f"""
    <div class="banner"><span class="bnum">٧</span><div><h1>التاء المربوطة ة</h1><p>نقرؤها تاءً… وإذا وقفنا عليها نقرؤها هاءً</p></div></div>
    <div class="tw two">
      <div class="twc c0"><span class="ar big">شَجَرَةٌ</span><b>في وسط الكلام</b><span class="ar">شَجَرَتُنْ</span></div>
      <div class="twc c1"><span class="ar big">شَجَرَهْ</span><b>عندما نقف</b><span>نقول: شَجَرَهْ</span></div>
    </div>
    <div class="cards">{''.join(card(c) for c in TAA_CARDS)}</div>
    """
    page(7, "", body, "intro tight")

    body = f"""
    <div class="tw two">
      <div class="twc c2"><span class="ar big">🌙 الْقَمَرُ</span><b>اللام القمرية</b><span>نقرأ اللام: «اَلْ» واضحة</span></div>
      <div class="twc c0"><span class="ar big">☀️ ا<span class="silent">ل</span>شَّمْسُ</span><b>اللام الشمسية</b><span>اللام تختفي، والحرف بعدها مشدَّد</span></div>
    </div>
    <div class="cards">{''.join(card(c) for c in QAMARI_CARDS)}</div>"""
    page(7, "🌙 الْ القمرية", body, "tight")
    cards = "".join(card(c) for c in SHAMSI_CARDS)
    page(7, "☀️ الْ الشمسية: اللام تُكتب ولا تُقرأ", f'<div class="cards">{cards}</div>' + tip("اللام الشمسية مكتوبة هنا بلون باهت لأننا لا ننطقها. لعبة: «القمر يُظهر اللام، والشمس تُخفيها بنورها!» ☀️"))
    cards = "".join(card(c) for c in HAMZA_CARDS)
    body = sec("✨", "الهمزة ء: صوت قصير من الحلق، تجلس وحدها أو فوق ا و ي", f'<div class="cards c4">{cards}</div>') + \
        sec("🎯", "الألف المقصورة ى: تُكتب مثل الياء بلا نقاط، ونقرؤها ألفًا «ا»", pills(ALIF_MAQSURA)) + \
        tip("الهمزة لها «كراسي» مختلفة: أ ؤ ئ ء — لكن صوتها واحد دائمًا. لا تشرح القواعد الآن، يكفي أن يقرأها.")
    page(7, "✨ حروف خاصة: ء و ى", body)


def stage8():
    body = f"""
    <div class="banner"><span class="bnum">٨</span><div><h1>الجمل والقصص</h1><p>نفس السُّلَّم… لكن بالكلمات! كلمة ← كلمتان ← جملة</p></div></div>
    <div class="slads">{''.join(sentence_ladder(e, w) for e, w in SENTENCES[:3])}</div>
    {tip("عند الجملة: اقرأ الكلمة الأولى، ثم الأولى والثانية معًا، ثم الجملة كلها. اسأله بعدها: «مَن؟ ماذا فعل؟».")}
    """
    page(8, "", body, "intro")
    page(8, "🪜 سُلَّم الجمل", f'<div class="slads">{"".join(sentence_ladder(e, w) for e, w in SENTENCES[3:])}</div>' + tip("الحرف الباهت في «السَّمَكُ» لام شمسية لا تُقرأ — تذكّر لعبة الشمس ☀️"))
    for n, s in enumerate(STORIES, 1):
        words = "".join(f'<span class="ar">{markup(w)}</span>' for w in s["words"])
        lines = "".join(f'<div class="sl"><span class="gn">{ar(i + 1)}</span><span class="ar">{markup(l)}</span>{stars(1)}</div>' for i, l in enumerate(s["lines"]))
        qs = "".join(f'<li class="ar">{markup(q)}</li>' for q in s["questions"])
        body = f"""
        <div class="scene">{s['scene']}</div>
        {sec("🔑", "كلمات القصة: اقرأها أولًا", f'<div class="swords">{words}</div>')}
        <div class="story">{lines}</div>
        <div class="qs"><b>💬 أسئلة بعد القراءة:</b><ol>{qs}</ol></div>
        """
        page(8, f'📖 القصة {ar(n)}: <span class="ar">{markup(s["title"])}</span>', body, "storyp")


def cut_cards():
    order = [l[0] for l in LESSONS] + ["ي"]
    first = [L + "َ" for L in order]
    extra = [L + h for L in "بتسمرلكدنع" for h in ("ُ", "ِ")]
    allc = first + extra[:20]
    for k in range(0, 48, 24):
        cells = "".join(f'<div class="cc c{(k + i) % 5}"><span class="ar">{c}</span></div>' for i, c in enumerate(allc[k:k + 24]))
        page(0, f"✂️ بطاقات الحروف للقص ({ar(k // 24 + 1)})", f'<div class="cutg">{cells}</div><p class="say center">قصّ البطاقات وابنِ بها كلمات: رَ + سَ + مَ = رَسَمَ 🪜</p>', "cutp")


def certificate():
    body = """
    <div class="cert">
      <div class="cert-top">🏆</div>
      <h1>شَهَادَةُ بَطَلِ الْقِرَاءَةِ</h1>
      <p>نشهد بأن البطل</p>
      <div class="cert-name"></div>
      <p>صعد سُلَّم القراءة درجةً درجةً حتى القمّة،<br>وأصبح يقرأ الكلمات والجمل والقصص بنفسه!</p>
      <div class="cert-stars">⭐⭐⭐⭐⭐</div>
      <div class="cert-sign"><span>التاريخ: ____________</span><span>التوقيع: ____________</span></div>
    </div>"""
    page(0, "", body, "certp")


def build():
    cover()
    guide()
    journey()
    stage1_intro()
    learned, all_words, block = [], [], []
    for i, (L, name, pic, emo, words, ptip) in enumerate(LESSONS, 1):
        lesson_pages(i, L, name, pic, emo, words, ptip, learned=list(learned), prev_words=list(all_words))
        learned.append(L)
        all_words.extend(words)
        block.extend(words)
        if i in REVIEW_AFTER:
            ws = block[:]
            if len(ws) < 16:
                extra = [w for w in all_words if w not in ws]
                ws += random.Random(i).sample(extra, min(16 - len(ws), len(extra)))
            review_page(REVIEW_AFTER[i], ws[:16], learned)
            block = []
    stage2()
    stage3()
    stage4()
    stage5()
    stage6()
    stage7()
    stage8()
    cut_cards()
    certificate()
    css = (pathlib.Path(__file__).parent / "style.css").read_text(encoding="utf-8")
    doc = f"""<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>سُلَّم القراءة — من الحرف إلى الكلمة</title>
<style>{css}</style></head>
<body>
<div class="toolbar"><b>سُلَّم القراءة</b> ، {ar(len(pages))} صفحة <button onclick="window.print()">🖨️ اطبع الكتاب</button></div>
{''.join(pages)}
</body></html>"""
    OUT.write_text(doc, encoding="utf-8")
    print(f"wrote {OUT} ({len(pages)} pages)")


if __name__ == "__main__":
    build()
