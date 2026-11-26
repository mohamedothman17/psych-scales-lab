/* Lazy chunk loaded by app.js (loadChunk) on first visit to its route. Neuro lab (#neuro): DESTRIEUX atlas + NEURO.
   Shares the global scope of app.js (C, S, $, PSY, VIEWS, ACCT, ...). Moved verbatim from app.js. */
/* Destrieux 2009 cortical atlas (the parcellation used on TRIBE v2's fsaverage5 output): Arabic name, lobe and a
   cautious description of commonly reported functions. Functions are tendencies from the neuroimaging literature,
   not one-to-one mappings ("reverse inference" is weak). Subcortical structures (amygdala, hippocampus, striatum,
   thalamus) are not on the cortical surface and are therefore never predicted by TRIBE v2. */
const DESTRIEUX = (() => {
  const F = 'الجبهي', P = 'الجداري', T = 'الصدغي', O = 'القذالي', I = 'الجزيرة', L = 'الحوفي (الحزامي)', C = 'المركزي (الحسي–الحركي)';
  const R = {
    'G_and_S_frontomargin': ['التلفيف والتلم الجبهي الهامشي', F, 'جزء من القشرة الجبهية الأمامية؛ التخطيط والتقييم'],
    'G_and_S_occipital_inf': ['التلفيف والتلم القذالي السفلي', O, 'معالجة بصرية'],
    'G_and_S_paracentral': ['الفصيص المجاور للمركزي', C, 'حركة وإحساس الطرف السفلي'],
    'G_and_S_subcentral': ['التلفيف والتلم تحت المركزي', C, 'حركة الوجه والفم؛ إنتاج الكلام'],
    'G_and_S_transv_frontopol': ['القطب الجبهي المستعرض', F, 'التفكير المجرد وتنسيق الأهداف المتعددة'],
    'G_and_S_cingul-Ant': ['الحزامي الأمامي', L, 'كشف التعارض، والانفعال، والألم الانفعالي، وتنظيم الانتباه'],
    'G_and_S_cingul-Mid-Ant': ['الحزامي الأوسط الأمامي', L, 'الضبط المعرفي والتحكم في الاستجابة'],
    'G_and_S_cingul-Mid-Post': ['الحزامي الأوسط الخلفي', L, 'التوجه الحركي والانتباه للجسم'],
    'G_cingul-Post-dorsal': ['الحزامي الخلفي الظهري', L, 'شبكة الوضع الافتراضي؛ التفكير الذاتي'],
    'G_cingul-Post-ventral': ['الحزامي الخلفي البطني', L, 'الذاكرة الذاتية والمعالجة الانفعالية'],
    'G_cuneus': ['الوتد (الكونيوس)', O, 'معالجة بصرية أولية'],
    'G_front_inf-Opercular': ['التلفيف الجبهي السفلي – الجزء الغطائي', F, 'إنتاج اللغة (منطقة بروكا) والتحكم في الكلام'],
    'G_front_inf-Orbital': ['التلفيف الجبهي السفلي – الجزء الحجاجي', F, 'معاني الكلمات والتقييم الانفعالي'],
    'G_front_inf-Triangul': ['التلفيف الجبهي السفلي – الجزء المثلثي', F, 'معالجة المعنى في اللغة (منطقة بروكا)'],
    'G_front_middle': ['التلفيف الجبهي الأوسط', F, 'الذاكرة العاملة والتخطيط والوظائف التنفيذية'],
    'G_front_sup': ['التلفيف الجبهي العلوي', F, 'الوعي بالذات، والتحكم التنفيذي، والتفكير في الآخرين'],
    'G_Ins_lg_and_S_cent_ins': ['الجزيرة الطويلة', I, 'الإحساس الداخلي بالجسم (الحشوي)'],
    'G_insular_short': ['الجزيرة القصيرة (الأمامية)', I, 'الوعي الانفعالي، والقلق، وإدراك حالة الجسم'],
    'G_occipital_middle': ['التلفيف القذالي الأوسط', O, 'معالجة بصرية'],
    'G_occipital_sup': ['التلفيف القذالي العلوي', O, 'معالجة بصرية مكانية'],
    'G_oc-temp_lat-fusifor': ['التلفيف المغزلي', T, 'التعرف على الوجوه والكلمات المكتوبة'],
    'G_oc-temp_med-Lingual': ['التلفيف اللساني', O, 'معالجة بصرية والذاكرة البصرية'],
    'G_oc-temp_med-Parahip': ['التلفيف المجاور للحصين', T, 'الذاكرة والسياق المكاني'],
    'G_orbital': ['التلفيف الحجاجي', F, 'تقييم المكافأة والقيمة الانفعالية واتخاذ القرار'],
    'G_pariet_inf-Angular': ['التلفيف الزاوي', P, 'المعنى، والقراءة، وشبكة الوضع الافتراضي'],
    'G_pariet_inf-Supramar': ['التلفيف فوق الهامشي', P, 'الذاكرة الصوتية، والتعاطف، وتمييز الذات عن الآخر'],
    'G_parietal_sup': ['الفصيص الجداري العلوي', P, 'الانتباه المكاني والذاكرة العاملة'],
    'G_postcentral': ['التلفيف خلف المركزي', C, 'الإحساس الجسدي'],
    'G_precentral': ['التلفيف أمام المركزي', C, 'الحركة الإرادية'],
    'G_precuneus': ['مقدم الوتد', P, 'التفكير الذاتي والذكريات الشخصية والتخيل'],
    'G_rectus': ['التلفيف المستقيم', F, 'التقييم الانفعالي والاجتماعي'],
    'G_subcallosal': ['التلفيف تحت الجسم الثفني', L, 'تنظيم المزاج؛ مرتبط في البحوث بالاكتئاب'],
    'G_temp_sup-G_T_transv': ['تلفيف هيشل (السمعي الأولي)', T, 'السمع الأولي'],
    'G_temp_sup-Lateral': ['التلفيف الصدغي العلوي – الوحشي', T, 'فهم الكلام المسموع والإدراك الاجتماعي'],
    'G_temp_sup-Plan_polar': ['المستوى القطبي الصدغي', T, 'معالجة سمعية وصوتية'],
    'G_temp_sup-Plan_tempo': ['المستوى الصدغي', T, 'معالجة أصوات الكلام (منطقة فيرنيكه)'],
    'G_temporal_inf': ['التلفيف الصدغي السفلي', T, 'التعرف على الأشياء والمعاني'],
    'G_temporal_middle': ['التلفيف الصدغي الأوسط', T, 'معاني الكلمات وفهم اللغة'],
    'Lat_Fis-ant-Horizont': ['الشق الجانبي – الفرع الأفقي الأمامي', F, 'جزء من منطقة اللغة الجبهية'],
    'Lat_Fis-ant-Vertical': ['الشق الجانبي – الفرع العمودي الأمامي', F, 'جزء من منطقة اللغة الجبهية'],
    'Lat_Fis-post': ['الشق الجانبي – الفرع الخلفي', T, 'معالجة سمعية ولغوية'],
    'Pole_occipital': ['القطب القذالي', O, 'الإبصار الأولي'],
    'Pole_temporal': ['القطب الصدغي', T, 'المعرفة الدلالية والاجتماعية والانفعالية'],
    'S_calcarine': ['التلم المهمازي', O, 'القشرة البصرية الأولية'],
    'S_central': ['التلم المركزي', C, 'الحد بين الحركة والإحساس'],
    'S_cingul-Marginalis': ['التلم الحزامي الهامشي', L, 'جزء من الشبكة الحزامية'],
    'S_circular_insula_ant': ['التلم الدائري للجزيرة – الأمامي', I, 'الوعي الانفعالي وحالة الجسم'],
    'S_circular_insula_inf': ['التلم الدائري للجزيرة – السفلي', I, 'معالجة سمعية وحشوية'],
    'S_circular_insula_sup': ['التلم الدائري للجزيرة – العلوي', I, 'الإحساس الداخلي بالجسم'],
    'S_collat_transv_ant': ['التلم الجانبي المستعرض الأمامي', T, 'الذاكرة والتعرف البصري'],
    'S_collat_transv_post': ['التلم الجانبي المستعرض الخلفي', O, 'معالجة بصرية'],
    'S_front_inf': ['التلم الجبهي السفلي', F, 'الضبط المعرفي واللغة'],
    'S_front_middle': ['التلم الجبهي الأوسط', F, 'الوظائف التنفيذية'],
    'S_front_sup': ['التلم الجبهي العلوي', F, 'الانتباه والذاكرة العاملة'],
    'S_interm_prim-Jensen': ['تلم جنسن', P, 'جزء من الفص الجداري السفلي'],
    'S_intrapariet_and_P_trans': ['التلم داخل الجداري', P, 'الانتباه، والأرقام، والتحكم في حركة العين'],
    'S_oc_middle_and_Lunatus': ['التلم القذالي الأوسط والهلالي', O, 'معالجة بصرية'],
    'S_oc_sup_and_transversal': ['التلم القذالي العلوي والمستعرض', O, 'معالجة بصرية مكانية'],
    'S_occipital_ant': ['التلم القذالي الأمامي', O, 'معالجة بصرية للحركة'],
    'S_oc-temp_lat': ['التلم القذالي الصدغي الوحشي', T, 'التعرف البصري'],
    'S_oc-temp_med_and_Lingual': ['التلم القذالي الصدغي الإنسي واللساني', T, 'الذاكرة البصرية'],
    'S_orbital_lateral': ['التلم الحجاجي الوحشي', F, 'التقييم واتخاذ القرار'],
    'S_orbital_med-olfact': ['التلم الحجاجي الإنسي (الشمي)', F, 'الشم والتقييم'],
    'S_orbital-H_Shaped': ['التلم الحجاجي على شكل H', F, 'تقييم المكافأة'],
    'S_parieto_occipital': ['التلم الجداري القذالي', P, 'الحد بين الجداري والقذالي'],
    'S_pericallosal': ['التلم حول الجسم الثفني', L, 'جزء من الشبكة الحزامية'],
    'S_postcentral': ['التلم خلف المركزي', P, 'معالجة حسية جسدية'],
    'S_precentral-inf-part': ['التلم أمام المركزي – السفلي', C, 'التحكم الحركي في الكلام'],
    'S_precentral-sup-part': ['التلم أمام المركزي – العلوي', C, 'التحكم الحركي وحركة العين'],
    'S_suborbital': ['التلم تحت الحجاجي', F, 'التقييم الانفعالي'],
    'S_subparietal': ['التلم تحت الجداري', P, 'شبكة الوضع الافتراضي'],
    'S_temporal_inf': ['التلم الصدغي السفلي', T, 'التعرف البصري والمعاني'],
    'S_temporal_sup': ['التلم الصدغي العلوي', T, 'فهم الكلام، وقراءة نوايا الآخرين، والإدراك الاجتماعي'],
    'S_temporal_transverse': ['التلم الصدغي المستعرض', T, 'السمع']
  };
  const LOBES = [F, C, P, T, O, I, L];
  function info(col) { // col like "L_G_front_sup" or "R_S_central" or "region_12"
    const m = String(col).match(/^([LR])_(.+)$/); const hemi = m ? (m[1] === 'L' ? 'الأيسر' : 'الأيمن') : '', key = m ? m[2] : col, r = R[key];
    return r ? { key, hemi, ar: r[0], lobe: r[1], fn: r[2], known: true } : { key, hemi, ar: col, lobe: '—', fn: '', known: false };
  }
  return { R, LOBES, info, keys: Object.keys(R) };
})();

/* ===== Neuro lab: TRIBE v2 (Meta FAIR, 2026) used where it is defensible for scale construction.
   TRIBE v2 predicts an average subject's fMRI response (fsaverage5 cortical mesh) to video, audio or text. It does not
   read anyone's mind and cannot run in a browser (GPU + gated LLaMA 3.2 text encoder; licence CC BY-NC 4.0).
   Use here: an exploratory "predicted neural coherence" check — do items written for the same dimension evoke more
   similar predicted cortical profiles than items from different dimensions? The site exports the items with a Python
   script; the researcher runs it on a GPU and imports the per-region CSV; all analysis below runs in the browser. ===== */
const NEURO = (() => {
  let data = null, srcScale = null;
  const pearson = (a, b) => { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let sab = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; sa += x * x; sb += y * y; } return sa && sb ? sab / Math.sqrt(sa * sb) : 0; };
  function script(items) {
    return `# -*- coding: utf-8 -*-
# Running TRIBE v2 on scale items — Psychological Scales Lab
# Requirements: a GPU with 24 GB or more (a Colab T4 is not enough), acceptance of the LLaMA 3.2 licence on Hugging Face,
# and tribev2 installed from https://github.com/facebookresearch/tribev2  (licence CC BY-NC 4.0: non-commercial use only).
# Check the function names against the repository README; this script follows the documented flow:
# TribeModel.from_pretrained -> get_events_dataframe -> predict  (predictions: timesteps x vertices on fsaverage5).
# Language: the text encoder does not officially support Arabic. For each item, fill in "text_en" (an accurate translation)
# and set USE_ENGLISH = True, or compare both runs.
import json, os, tempfile
import numpy as np, pandas as pd
from nilearn import datasets
from tribev2 import TribeModel  # adjust if the README uses a different import path

USE_ENGLISH = False
ITEMS = json.loads(r'''${JSON.stringify(items, null, 1)}''')

model = TribeModel.from_pretrained("facebook/tribev2")
atlas = datasets.fetch_atlas_surf_destrieux()          # fsaverage5: 10242 vertices per hemisphere
names = [n.decode() if isinstance(n, bytes) else str(n) for n in atlas["labels"]]
lab = np.concatenate([atlas["map_left"], np.asarray(atlas["map_right"]) + 1000])

rows = []
for it in ITEMS:
    text = (it.get("text_en") or it["text"]) if USE_ENGLISH else it["text"]
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(text); path = f.name
    events = model.get_events_dataframe(text_path=path)
    preds, segments = model.predict(events=events)
    v = np.asarray(preds).mean(axis=0)                  # average predicted response over time
    row = {"item_id": it["id"], "dim": it["dim"]}
    for code in np.unique(lab):
        nm = names[code % 1000]
        if nm in ("Unknown", "Medial_wall"):
            continue
        row[("R_" if code >= 1000 else "L_") + nm] = float(v[lab == code].mean())
    rows.append(row); os.unlink(path)
    print("done:", it["id"])

pd.DataFrame(rows).to_csv("tribe_items_regions.csv", index=False, encoding="utf-8")
print("Upload tribe_items_regions.csv to the Neuro lab on the site")
`;
  }
  /* ---- running TRIBE: Colab notebook and a Hugging Face Space (ZeroGPU) that the site can call ---- */
  const CORE_PY = `def item_regions(model, text):
    """Average predicted cortical response to one item, aggregated to the 148 Destrieux regions."""
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(text); path = f.name
    try:
        events = model.get_events_dataframe(text_path=path)
        preds, segments = model.predict(events=events)
    finally:
        os.unlink(path)
    v = np.asarray(preds).mean(axis=0)
    out = {}
    for code in np.unique(LAB):
        nm = NAMES[code % 1000]
        if nm in ("Unknown", "Medial_wall"):
            continue
        out[("R_" if code >= 1000 else "L_") + nm] = float(v[LAB == code].mean())
    return out`;
  const ATLAS_PY = `atlas = datasets.fetch_atlas_surf_destrieux()          # fsaverage5: 10242 vertices per hemisphere
NAMES = [n.decode() if isinstance(n, bytes) else str(n) for n in atlas["labels"]]
LAB = np.concatenate([np.asarray(atlas["map_left"]), np.asarray(atlas["map_right"]) + 1000])`;
  function notebook(items) {
    const cell = (type, src) => ({ cell_type: type, metadata: {}, source: src.split('\n').map((l, i, a) => i < a.length - 1 ? l + '\n' : l), ...(type === 'code' ? { execution_count: null, outputs: [] } : {}) });
    const nb = { nbformat: 4, nbformat_minor: 5, metadata: { accelerator: 'GPU', colab: { gpuType: 'A100' }, kernelspec: { name: 'python3', display_name: 'Python 3' } }, cells: [
      cell('markdown', '# TRIBE v2 on scale items\nRuntime > Change runtime type > **A100** or **L4** (a T4 runs out of memory). Then Runtime > Run all.\n\nBefore running: accept the LLaMA 3.2 licence at huggingface.co/meta-llama/Llama-3.2-3B with your Hugging Face account, and create a read token.\n\nLicence of TRIBE v2: CC BY-NC 4.0 (non-commercial research and teaching).'),
      cell('code', '!pip -q install git+https://github.com/facebookresearch/tribev2 nilearn pandas'),
      cell('code', 'from huggingface_hub import notebook_login\nnotebook_login()   # paste your read token'),
      cell('code', 'import json, os, tempfile\nimport numpy as np, pandas as pd\nfrom nilearn import datasets\nfrom tribev2 import TribeModel\n\nUSE_ENGLISH = False   # True: use the "text_en" field (fill it with accurate translations)\nITEMS = json.loads(r\'\'\'' + JSON.stringify(items, null, 1) + '\'\'\')\n\nmodel = TribeModel.from_pretrained("facebook/tribev2")\n' + ATLAS_PY + '\n\n' + CORE_PY),
      cell('code', 'rows = []\nfor it in ITEMS:\n    text = (it.get("text_en") or it["text"]) if USE_ENGLISH else it["text"]\n    rows.append({"item_id": it["id"], "dim": it["dim"], **item_regions(model, text)})\n    print("done:", it["id"])\npd.DataFrame(rows).to_csv("tribe_items_regions.csv", index=False, encoding="utf-8")'),
      cell('code', 'from google.colab import files\nfiles.download("tribe_items_regions.csv")   # then upload it in the site\'s Neuro lab')] };
    return JSON.stringify(nb, null, 1);
  }
  const SPACE = {
    'app.py': `# Hugging Face Space (Gradio + ZeroGPU) that runs TRIBE v2 on scale items for the Psychological Scales Lab.
# Setup: Space SDK = Gradio, hardware = ZeroGPU (needs a PRO account), add a secret HF_TOKEN whose account accepted the
# LLaMA 3.2 licence. Non-commercial use only (CC BY-NC 4.0). Check names against the tribev2 README if the API changes.
import os, json, tempfile
import numpy as np, pandas as pd, gradio as gr, spaces
from huggingface_hub import login
from nilearn import datasets
from tribev2 import TribeModel

if os.environ.get("HF_TOKEN"):
    login(token=os.environ["HF_TOKEN"])
model = TribeModel.from_pretrained("facebook/tribev2")
${ATLAS_PY}
MAX_ITEMS, MAX_CHARS = 60, 400

${CORE_PY}

@spaces.GPU(duration=180)
def run_batch(texts):
    return [item_regions(model, t) for t in texts]

def regions(items_json):
    try:
        items = json.loads(items_json)
    except Exception:
        raise gr.Error("items must be a JSON list")
    if not isinstance(items, list) or not 1 <= len(items) <= MAX_ITEMS:
        raise gr.Error(f"send 1-{MAX_ITEMS} items")
    texts = []
    for it in items:
        t = str(it.get("text_en") or it.get("text") or "")[:MAX_CHARS]
        if not t.strip():
            raise gr.Error("empty item text")
        texts.append(t)
    rows = [{"item_id": str(it.get("id")), "dim": str(it.get("dim", "")), **r} for it, r in zip(items, run_batch(texts))]
    return pd.DataFrame(rows).to_csv(index=False)

demo = gr.Interface(fn=regions, inputs=gr.Textbox(label="items JSON", lines=8), outputs=gr.Textbox(label="regions CSV"),
                    title="TRIBE v2 - scale items to Destrieux regions", api_name="regions")
demo.queue(max_size=8).launch()
`,
    'requirements.txt': 'git+https://github.com/facebookresearch/tribev2\nnilearn\npandas\nnumpy\nspaces\n',
    'README.md': '---\ntitle: TRIBE Scale Items\nsdk: gradio\napp_file: app.py\nlicense: cc-by-nc-4.0\n---\nRuns TRIBE v2 (Meta FAIR) on questionnaire items and returns mean predicted activation per Destrieux cortical region.\n'
  };
  async function callSpace(base, items, onMsg) { // Gradio HTTP API: POST /gradio_api/call/<api>, then read the event stream
    base = base.trim().replace(/\/+$/, '');
    if (!/^https:\/\/[a-z0-9-]+\.hf\.space$/i.test(base)) throw new Error('اكتب رابط الخدمة بالشكل https://username-spacename.hf.space');
    onMsg('إرسال العبارات…');
    const r = await fetch(base + '/gradio_api/call/regions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: [JSON.stringify(items)] }) });
    if (!r.ok) throw new Error('لم تقبل الخدمة الطلب (' + r.status + '). تأكد أنها تعمل وأنها عامة.');
    const { event_id } = await r.json(); onMsg('النموذج يعمل على البطاقة الرسومية… (أول تشغيل قد يستغرق دقائق)');
    const txt = await (await fetch(base + '/gradio_api/call/regions/' + event_id)).text();
    const blocks = txt.split(/\n\n/).map(b => ({ ev: (b.match(/^event: *(.+)$/m) || [])[1], data: (b.match(/^data: *(.*)$/m) || [])[1] }));
    const done = blocks.find(b => b.ev === 'complete'), err = blocks.find(b => b.ev === 'error');
    if (!done) throw new Error('توقفت الخدمة' + (err && err.data && err.data !== 'null' ? ': ' + err.data : ' (ربما انتهت حصة الـ GPU المجانية؛ جرّب لاحقًا).'));
    return JSON.parse(done.data)[0];
  }
  function parseCSV(txt) {
    const lines = txt.replace(/\r/g, '').split('\n').filter(l => l.trim()); if (lines.length < 3) throw new Error('الملف قصير');
    const head = lines[0].split(',').map(x => x.trim()); const iI = head.indexOf('item_id'), iD = head.indexOf('dim');
    if (iI < 0 || iD < 0) throw new Error('يلزم عمودا item_id و dim');
    const regs = head.map((h, i) => i).filter(i => i !== iI && i !== iD); if (regs.length < 5) throw new Error('عدد المناطق أقل من 5');
    const items = lines.slice(1).map(l => { const c = l.split(','); return { id: c[iI], dim: c[iD], v: regs.map(i => +c[i]) }; }).filter(x => x.v.every(isFinite));
    if (items.length < 4) throw new Error('عدد العبارات أقل من 4');
    return { items, regions: regs.map(i => head[i]) };
  }
  function simulate() { // illustrative only: real atlas names, a shared language response, dimension-specific emphases
    const regions = ['L_', 'R_'].flatMap(h => DESTRIEUX.keys.map(k => h + k));
    const lang = ['G_temp_sup-Lateral', 'S_temporal_sup', 'G_temporal_middle', 'G_front_inf-Triangul', 'G_front_inf-Opercular', 'G_pariet_inf-Angular', 'G_temp_sup-Plan_tempo'];
    const prof = { 'التأجيل السلوكي': ['G_precuneus', 'G_cingul-Post-dorsal', 'G_front_sup', 'G_pariet_inf-Angular', 'S_subparietal'], 'إدارة الوقت': ['G_front_middle', 'S_front_inf', 'G_parietal_sup', 'S_intrapariet_and_P_trans', 'S_front_sup'], 'القلق والتجنب': ['G_insular_short', 'G_and_S_cingul-Ant', 'S_circular_insula_ant', 'G_orbital', 'Pole_temporal', 'G_subcallosal'] };
    const w = (keys, col, left) => keys.includes(col.slice(2)) ? (col[0] === 'L' ? left : 1) : 0;
    const shared = regions.map(c => 1.6 * w(lang, c, 1.4) + (Math.random() - 0.5) * 0.6);
    const items = []; Object.keys(prof).forEach((d, k) => { const base = regions.map(c => 1.3 * w(prof[d], c, 1) + (Math.random() - 0.5) * 0.5); for (let i = 0; i < 4; i++) items.push({ id: 'sim' + k + i, dim: d, v: base.map((x, r) => 0.8 * x + shared[r] + (Math.random() - 0.5) * (i === 3 && k === 1 ? 2.2 : 0.7)) }); });
    return { items, regions, sim: true };
  }
  /* What is distinctive about each dimension: z of the dimension mean against all items, region by region.
     Raw activation is dominated by the language network for every sentence; the contrast is what tells dimensions apart. */
  function regionMap(D) {
    const it = D.items, R = D.regions.length, mu = [], sd = [];
    for (let r = 0; r < R; r++) { const x = it.map(i => i.v[r]), m = x.reduce((a, b) => a + b, 0) / x.length; mu[r] = m; sd[r] = Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, x.length - 1)) || 1; }
    const z = v => v.map((x, r) => (x - mu[r]) / sd[r]);
    const rawTop = mu.map((x, r) => [r, x]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
    const dims = [...new Set(it.map(x => x.dim))];
    const byDim = dims.map(d => { const m = it.filter(x => x.dim === d), zz = z(D.regions.map((_, r) => m.reduce((s, x) => s + x.v[r], 0) / m.length));
      const top = zz.map((x, r) => [r, x]).sort((a, b) => b[1] - a[1]).slice(0, 6), lobes = {};
      zz.forEach((x, r) => { const L = DESTRIEUX.info(D.regions[r]).lobe; (lobes[L] = lobes[L] || []).push(x); });
      return { d, top, lobe: Object.fromEntries(Object.entries(lobes).map(([k, a]) => [k, a.reduce((s, x) => s + x, 0) / a.length])) }; });
    const byItem = it.map(x => z(x.v).map((v, r) => [r, v]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(p => p[0]));
    return { rawTop, byDim, byItem, known: D.regions.filter(c => DESTRIEUX.info(c).known).length };
  }
  const regName = c => { const f = DESTRIEUX.info(c); return f.known ? `${esc(f.ar)} <span class="muted">(${f.hemi})</span>` : esc(c); };
  function brainSVG(lobe) { // schematic lateral view; colour = mean z of the lobe for this dimension
    const ok = v => typeof v === 'number' && isFinite(v);
    const col = v => !ok(v) ? 'transparent' : v >= 0 ? `rgba(91,63,209,${Math.min(0.9, 0.12 + v * 1.2).toFixed(2)})` : `rgba(242,100,60,${Math.min(0.9, 0.12 - v * 1.2).toFixed(2)})`;
    const P = [['الجبهي', 'M30 118 C18 70 52 26 112 20 L128 22 L120 96 L74 128 Z', 72, 72], ['المركزي (الحسي–الحركي)', 'M128 22 L150 24 L142 104 L120 96 Z', 135, 62], ['الجداري', 'M150 24 C200 26 236 46 246 82 L196 98 L142 104 Z', 194, 64], ['القذالي', 'M246 82 C262 104 258 132 236 146 L204 128 L196 98 Z', 230, 116], ['الصدغي', 'M74 128 L120 96 L142 104 L196 98 L204 128 L236 146 C200 166 124 168 84 150 Z', 150, 136]];
    const g = P.map(([n, d, x, y]) => `<path d="${d}" fill="${col(lobe[n])}" stroke="currentColor" stroke-opacity=".55" stroke-width="1.2"><title>${n}: ${ok(lobe[n]) ? fmt(lobe[n]) : '—'}</title></path><text x="${x}" y="${y}" font-size="10" text-anchor="middle" fill="currentColor">${n.split(' ')[0]}</text>`).join('');
    const extra = [['الجزيرة', 'الجزيرة (داخل الشق الجانبي)', 182], ['الحوفي (الحزامي)', 'الحزامي (السطح الداخلي)', 182]].map(([k, t], i) => `<circle cx="${i ? 124 : 262}" cy="178" r="6" fill="${col(lobe[k])}" stroke="currentColor" stroke-opacity=".55"><title>${t}: ${ok(lobe[k]) ? fmt(lobe[k]) : '—'}</title></circle><text x="${i ? 114 : 252}" y="182" font-size="9" fill="currentColor" direction="rtl" text-anchor="start">${t}</text>`).join('');
    return `<svg viewBox="0 0 270 192" style="width:100%;max-width:300px;height:auto" role="img" aria-label="خريطة تقريبية لفصوص المخ (منظر جانبي)">${g}${extra}</svg>`;
  }
  function analyse(D) {
    const it = D.items, n = it.length, S = it.map(a => it.map(b => pearson(a.v, b.v)));
    const coh = lab => { let w = 0, nw = 0, bt = 0, nb = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (lab[i] === lab[j]) { w += S[i][j]; nw++; } else { bt += S[i][j]; nb++; } } return { w: nw ? w / nw : NaN, b: nb ? bt / nb : NaN }; };
    const labs = it.map(x => x.dim), obs = coh(labs), nci = obs.w - obs.b;
    let ge = 0; const P = 2000; for (let p = 0; p < P; p++) { const sh = labs.slice().sort(() => Math.random() - 0.5), c = coh(sh); if (c.w - c.b >= nci) ge++; }
    const dims = [...new Set(labs)];
    const centroid = d => { const m = it.filter(x => x.dim === d); return m[0].v.map((_, r) => m.reduce((s, x) => s + x.v[r], 0) / m.length); };
    const C = Object.fromEntries(dims.map(d => [d, centroid(d)]));
    const fit = it.map(x => { const own = (() => { const m = it.filter(y => y.dim === x.dim && y !== x); if (!m.length) return NaN; const c = x.v.map((_, r) => m.reduce((s, y) => s + y.v[r], 0) / m.length); return pearson(x.v, c); })(); const other = dims.filter(d => d !== x.dim).map(d => [d, pearson(x.v, C[d])]).sort((a, b) => b[1] - a[1])[0] || ['', NaN]; return { own, other }; });
    const perDim = dims.map(d => { const idx = labs.map((l, i) => l === d ? i : -1).filter(i => i >= 0); let s = 0, c = 0; idx.forEach((i, a) => idx.slice(a + 1).forEach(j => { s += S[i][j]; c++; })); return [d, idx.length, c ? s / c : NaN]; });
    return { S, obs, nci, p: (ge + 1) / (P + 1), fit, perDim, dims };
  }
  function mantel(S, E) { // correlation between two similarity matrices, permutation p
    const n = S.length, iu = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) iu.push([i, j]);
    const r0 = pearson(iu.map(([i, j]) => S[i][j]), iu.map(([i, j]) => E[i][j])); let ge = 0; const P = 2000;
    for (let p = 0; p < P; p++) { const pi = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5); if (pearson(iu.map(([i, j]) => S[pi[i]][pi[j]]), iu.map(([i, j]) => E[i][j])) >= r0) ge++; }
    return { r: r0, p: (ge + 1) / (P + 1) };
  }
  function heat(S, labels) {
    const n = S.length, c = Math.max(10, Math.min(28, Math.floor(420 / n)));
    const col = v => { const t = Math.max(-1, Math.min(1, v)); return t >= 0 ? `rgba(91,63,209,${0.12 + 0.85 * t})` : `rgba(242,100,60,${0.12 + 0.85 * -t})`; };
    let g = ''; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) g += `<rect x="${j * c}" y="${i * c}" width="${c - 1}" height="${c - 1}" fill="${col(S[i][j])}"><title>${esc(labels[i])} × ${esc(labels[j])}: ${fmt(S[i][j])}</title></rect>`;
    return `<svg viewBox="0 0 ${n * c} ${n * c}" style="width:min(100%,${n * c}px);height:auto" role="img" aria-label="مصفوفة تشابه الأنماط العصبية المتوقعة بين العبارات">${g}</svg>`;
  }
  function results(el) {
    const A = analyse(data), M = regionMap(data), it = data.items, dimOf = id => (it.find(x => x.id === id) || {}).dim;
    const label = x => { if (srcScale) { const s = SCALES.get(srcScale), item = s && s.items.find(i => i.id === x.id); if (item) return (s.items.indexOf(item) + 1) + '. ' + item.text; } return x.id; };
    let emp = '';
    if (srcScale && !data.sim && typeof BUILD !== 'undefined') { const s = SCALES.get(srcScale), An = s && BUILD.analyze(s); if (An && An.rows && An.rows.length >= 20) { const idx = it.map(x => An.items.findIndex(i => i.id === x.id)); if (idx.every(i => i >= 0)) { const cols = idx.map(j => An.rows.map(r => r[j])), E = cols.map(a => cols.map(b => pearson(a, b))), m = mantel(A.S, E); emp = `<div class="notice small"><b>مقارنة بالبيانات الفعلية</b>الارتباط بين مصفوفة التشابه العصبي المتوقع ومصفوفة الارتباط الفعلية بين العبارات (اختبار مانتل): r = ${fmt(m.r)}، p = ${fmtp(m.p)}. ${m.p < 0.05 ? 'العبارات المتشابهة في نمطها العصبي المتوقع ترتبط أكثر في استجابات المفحوصين.' : 'لم يظهر تطابق دال بين التنبؤ العصبي والبيانات الفعلية.'}</div>`; } } }
    el.innerHTML = `${data.sim ? '<div class="notice warn small"><b>بيانات محاكاة للتدريب</b>هذه الأرقام مولّدة لتجربة التحليل، وليست مخرجات TRIBE v2.</div>' : ''}
      <div class="kpis"><div class="tile hl"><small>مؤشر التماسك العصبي المتوقع</small><b>${fmt(A.nci, 3)}</b></div><div class="tile"><small>التشابه داخل الأبعاد</small><b>${fmt(A.obs.w, 3)}</b></div><div class="tile"><small>التشابه بين الأبعاد</small><b>${fmt(A.obs.b, 3)}</b></div><div class="tile ${A.p < 0.05 ? 'good' : ''}"><small>اختبار التباديل (2000)</small><b>${fmtp(A.p)}</b></div></div>
      <div class="verdict ${A.p < 0.05 ? 'good' : 'warn'}">${A.p < 0.05 ? 'عبارات البعد الواحد تُحدث أنماطًا عصبية متوقعة أكثر تشابهًا من عبارات الأبعاد الأخرى (دال).' : 'لا يميز التنبؤ العصبي بين الأبعاد تمييزًا دالًا؛ هذا لا ينفي صدق المقياس، لكنه لا يدعمه من هذه الزاوية.'}</div>
      ${emp}
      <div class="grid2"><section class="stack"><h4 style="margin:0">مصفوفة التشابه بين العبارات</h4>${heat(A.S, it.map(label))}<p class="small muted">بنفسجي = تشابه موجب، برتقالي = سالب. العبارات مرتبة حسب البعد.</p></section>
      <section class="stack"><h4 style="margin:0">التماسك داخل كل بعد</h4>${tableHTML(['البعد', 'العبارات', 'متوسط التشابه'], A.perDim.map(d => [esc(d[0]), N(d[1], 0), N(d[2], 3)]))}</section></div>
      <h3 style="margin:8px 0 0">أماكن النشاط المتوقع في المخ</h3>
      ${M.known < data.regions.length / 2 ? '<div class="notice warn small">أسماء الأعمدة ليست من أطلس Destrieux، فتظهر المناطق بأسمائها كما هي من غير ترجمة.</div>' : ''}
      <div class="notice small"><b>كيف تُقرأ؟</b>أي جملة تُنشّط شبكة اللغة أكثر من غيرها، فأعلى المناطق نشاطًا خامًا متشابهة في كل الأبعاد: ${M.rawTop.map(r => regName(data.regions[r])).join('، ')}. لذلك نعرض لكل بعد <b>المناطق التي تميّزه عن باقي العبارات</b> (درجة z)، وليس أعلى نشاط خام.</div>
      <div class="stack">${M.byDim.map(o => `<section class="card stack"><h4 style="margin:0">${esc(o.d)}</h4><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start"><div style="flex:0 1 260px">${brainSVG(o.lobe)}</div><div style="flex:1 1 360px;min-width:0">${tableHTML(['المنطقة', 'الفص', 'z', 'وظائف شائعة في البحوث'], o.top.map(([r, v]) => { const f = DESTRIEUX.info(data.regions[r]); return [regName(data.regions[r]), esc(f.lobe), N(v, 2), esc(f.fn || '—')]; }))}</div></div></section>`).join('')}</div>
      <p class="small muted">بنفسجي = نشاط متوقع أعلى من متوسط العبارات، برتقالي = أقل. الوظائف المذكورة «ميول» من الأدبيات وليست تشخيصًا؛ فالقول بأن «نشاط الجزيرة = قلق» استدلال عكسي ضعيف، لأن المنطقة الواحدة تشارك في وظائف كثيرة.</p>
      <h4 style="margin:0">ملاءمة كل عبارة لبعدها، ومناطقها المميزة</h4>${tableHTML(['العبارة', 'البعد المقصود', 'التشابه مع بعدها', 'أقرب بعد آخر', 'التشابه معه', 'أبرز 3 مناطق', 'الحكم'], it.map((x, i) => { const f = A.fit[i], bad = isFinite(f.own) && f.other[1] > f.own; return { cls: bad ? 'flag' : '', cells: [esc(label(x)), esc(x.dim), N(f.own, 3), esc(f.other[0]), N(f.other[1], 3), '<span class="small">' + M.byItem[i].map(r => regName(data.regions[r])).join('<br>') + '</span>', bad ? '<span class="chip warn">أقرب لبعد آخر — راجع صياغتها</span>' : '<span class="chip good">منسجمة</span>'] }; }))}
      <div class="notice warn small"><b>حدود الدقة المكانية</b>TRIBE v2 يتنبأ على <b>سطح القشرة فقط</b> (حوالي 20 ألف نقطة على fsaverage5) لمخ «متوسط». لذلك لا تظهر هنا البنى العميقة مثل اللوزة والحُصين والمخطط والمهاد، رغم أهميتها في القلق والانفعال والذاكرة. وكل منطقة هنا متوسط مئات النقاط، فالدقة «منطقة تشريحية» وليست «نقطة».</div>
      <p class="small muted">التفسير الآمن: هذا مؤشر <b>استكشافي</b> مبني على تنبؤ لمخ «متوسط»، وليس قياسًا لأدمغة المفحوصين ولا دليل صدق مستقلًا. استخدمه لاكتشاف عبارات تستحق المراجعة، ثم احسم بالتحليل العاملي والتحكيم.</p>`;
  }
  VIEWS.neuro = el => {
    const L = (typeof SCALES !== 'undefined' ? SCALES.list() : []).filter(s => (s.items || []).filter(i => i.keep !== false).length >= 4);
    el.innerHTML = `<div class="section-title"><h2>المختبر العصبي · TRIBE v2</h2><span class="chip">ناشئ · استكشافي</span></div>
      <section class="card stack"><h3 style="margin:0">ما هو TRIBE v2؟</h3>
        <p style="margin:0">نموذج أساس أطلقه فريق Meta FAIR في مارس 2026، يتنبأ باستجابة الرنين المغناطيسي الوظيفي (fMRI) على سطح القشرة المخية لمخ «متوسط» عند مشاهدة فيديو أو سماع صوت أو قراءة نص. دُرّب على أكثر من 1000 ساعة من تسجيلات fMRI لـ 720 شخصًا.</p>
        ${tableHTML(['يستطيع', 'لا يستطيع'], [['التنبؤ بالنمط المتوقع لنشاط القشرة لمثير معين', 'قراءة أفكار شخص أو مشاعره'], ['مقارنة مثيرات أو عبارات افتراضيًا قبل التجربة', 'الحلول محل تجربة على بشر'], ['اقتراح فرضيات عن معالجة اللغة والانفعال', 'تشخيص اضطراب أو قياس سمة لدى فرد']])}
        <p class="small muted" style="margin:0">الرخصة CC BY-NC 4.0 (استخدام بحثي وتعليمي غير تجاري). يتطلب بطاقة رسومية قوية (24 جيجابايت فأكثر) وقبول رخصة نموذج LLaMA 3.2، لذلك لا يعمل داخل المتصفح. ومُشفّر النص لا يدعم العربية رسميًا، فقارن النتائج بترجمة إنجليزية دقيقة للعبارات.</p></section>
      <section class="card stack"><h3 style="margin:0">${ic('download')} الخطوة 1: صدّر عبارات مقياسك وشغّل النموذج</h3>
        <p class="small muted" style="margin:0">الفكرة: لو كانت عبارات البعد الواحد تقيس شيئًا واحدًا، فالمتوقع أن تُحدث أنماطًا عصبية متوقعة أكثر تشابهًا من عبارات الأبعاد الأخرى.</p>
        ${L.length ? `<div class="row"><select id="nScale" aria-label="المقياس">${L.map(s => `<option value="${s.id}">${esc(s.name)} (${s.items.filter(i => i.keep !== false).length} عبارة)</option>`).join('')}</select><button class="btn sm" id="nPy">${ic('download')} سكربت Python + العبارات</button><button class="btn sm ghost" id="nJs">ملف العبارات JSON</button></div>` : '<p class="muted small" style="margin:0">ابنِ مقياسًا فيه 4 عبارات على الأقل في «ابنِ مقياسك» أولًا.</p>'}
        <p class="small" style="margin:0">الناتج ملف <code>tribe_items_regions.csv</code>: لكل عبارة متوسط النشاط المتوقع في 148 منطقة قشرية (أطلس Destrieux، 74 في كل نصف كرة)، ثم ترفعه في الخطوة 2. اختر طريقة التشغيل:</p>
        ${tableHTML(['الطريقة', 'التكلفة', 'السهولة'], [['<b>أ. Google Colab</b>: افتح الدفتر واختر A100 أو L4 ثم «تشغيل الكل»', 'Colab Pro تقريبًا 10 دولار/شهر', 'سهلة جدًا'], ['<b>ب. خدمة Hugging Face (ZeroGPU)</b>: ترفع الملفات الثلاثة مرة واحدة، والموقع يتصل بها مباشرة', 'اشتراك PRO تقريبًا 9 دولار/شهر', 'إعداد مرة واحدة، بعدها زرار'], ['<b>ج. خادم الجامعة أو Kaggle</b>: سكربت Python', 'مجاني غالبًا (Kaggle 16 جيجا قد لا تكفي)', 'متوسطة']])}
        ${L.length ? `<div class="row"><button class="btn sm" id="nNb">${ic('download')} دفتر Colab</button><button class="btn sm ghost" id="nSp">ملفات خدمة Hugging Face</button></div>` : ''}
        <details class="small"><summary>خطوات خدمة Hugging Face (مرة واحدة)</summary><ol style="margin:6px 0 0"><li>اشترك في Hugging Face PRO، واقبل رخصة LLaMA 3.2 من صفحة meta-llama/Llama-3.2-3B.</li><li>أنشئ Space جديدة: SDK = Gradio، العتاد = ZeroGPU، واجعلها عامة.</li><li>ارفع app.py وrequirements.txt وREADME.md، وأضف في الإعدادات «Secret» اسمه HF_TOKEN بتوكن قراءة.</li><li>انسخ رابط الخدمة (https://username-spacename.hf.space) والصقه بالأسفل.</li></ol></details>
        ${L.length ? `<div class="row"><input id="nSpace" dir="ltr" placeholder="https://username-tribe.hf.space" style="flex:1;min-width:220px" aria-label="رابط خدمة Hugging Face"><button class="btn sm" id="nRun">شغّل TRIBE على عبارات المقياس</button></div><div id="nRunMsg" class="small muted"></div>` : ''}
        <p class="small muted" style="margin:0">العرض التجريبي الرسمي من Meta (aidemos.atmeta.com/tribev2) يعرض خرائط للمخ للمشاهدة، لكنه لا يصدّر أرقامًا لكل منطقة، فلا يصلح للتحليل هنا.</p></section>
      <section class="card stack"><h3 style="margin:0">${ic('upload')} الخطوة 2: حلّل النتائج</h3>
        <div class="row"><input type="file" id="nCsv" accept=".csv,text/csv"><button class="btn sm ghost" id="nSim">جرّب ببيانات محاكاة</button></div><div id="nOut"></div></section>`;
    const sel = $('#nScale', el), items = () => { const s = SCALES.get(sel.value); return s.items.filter(i => i.keep !== false).map(i => ({ id: i.id, dim: (s.dims.find(d => d.id === i.dim) || {}).name || '', text: i.text, text_en: '' })); };
    if (sel) {
      $('#nNb', el).onclick = () => downloadFile('tribe_items.ipynb', notebook(items()), 'application/x-ipynb+json');
      $('#nSp', el).onclick = async () => { for (const [n, t] of Object.entries(SPACE)) await downloadFile(n, t); };
      const sp = $('#nSpace', el), msg = $('#nRunMsg', el); try { sp.value = localStorage.getItem('tribeSpace') || ''; } catch (e) {}
      $('#nRun', el).onclick = async () => { const b = $('#nRun', el); b.disabled = true; try { try { localStorage.setItem('tribeSpace', sp.value.trim()); } catch (e) {} const csv = await callSpace(sp.value, items(), t => { msg.textContent = t; }); data = parseCSV(csv); srcScale = sel.value; msg.textContent = 'تم. النتائج بالأسفل.'; results($('#nOut', el)); } catch (err) { msg.textContent = err.message === 'Failed to fetch' ? 'تعذّر الاتصال بالخدمة (قد تكون نائمة أو محجوبة من هذه الصفحة). جرّب من موقع GitHub أو انتظر دقيقة.' : err.message; } finally { b.disabled = false; } };
    }
    if (sel) { $('#nPy', el).onclick = () => downloadFile('tribe_items.py', script(items()), 'text/x-python;charset=utf-8'); $('#nJs', el).onclick = () => downloadFile('tribe_items.json', JSON.stringify(items(), null, 1), 'application/json'); }
    $('#nCsv', el).onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { data = parseCSV(rd.result); srcScale = sel ? sel.value : null; results($('#nOut', el)); } catch (err) { $('#nOut', el).innerHTML = `<div class="notice bad small">${esc(err.message)}</div>`; } }; rd.readAsText(f); };
    $('#nSim', el).onclick = () => { data = simulate(); srcScale = null; results($('#nOut', el)); };
  };
  return {};
})();
