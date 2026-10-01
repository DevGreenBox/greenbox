// Сводка Lighthouse: прогоны, режим первого кадра (задержан / сразу), медианы по режимам, LCP-элемент, вес, шрифты,
// сравнение с checklist/lh-summary.json («после»). Запуск: node lh-summary.mjs a [b ...] — префиксы пачек.
import { readFileSync, readdirSync } from 'node:fs'
import { save, OUT } from './lib.mjs'

const prefixes = process.argv.slice(2).length ? process.argv.slice(2) : ['a']
const median = (xs) => {
  const s = xs.filter((x) => x !== undefined && x !== null).sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null
}
const kb = (n) => Math.round((n ?? 0) / 1024)
const base = (u) => u.replace('http://localhost:3100', '').replace(/\?.*$/, '')

function one(file, r) {
  const a = r.audits
  const reqs = a['network-requests'].details.items
  const byType = {}
  for (const q of reqs) byType[q.resourceType] = (byType[q.resourceType] ?? 0) + (q.transferSize ?? 0)
  const obs = a.metrics.details.items[0]
  const d = a['lcp-breakdown-insight']?.details
  const node = d?.items?.find((i) => i.type === 'node')
  const parts = d?.items?.find((i) => i.type === 'table')?.items?.map((p) => `${p.label} ${Math.round(p.duration)} мс`)
  return {
    file,
    form: r.configSettings.formFactor,
    // Задержка первого кадра headless: наблюдаемый FCP больше 0,7 с при локальном сервере
    mode: obs.observedFirstContentfulPaint > 700 ? 'delayed' : 'immediate',
    scores: Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
    LCP: a['largest-contentful-paint'].numericValue,
    FCP: a['first-contentful-paint'].numericValue,
    TBT: a['total-blocking-time'].numericValue,
    CLS: a['cumulative-layout-shift'].numericValue,
    SI: a['speed-index'].numericValue,
    TTI: a.interactive?.numericValue,
    observedFCP: obs.observedFirstContentfulPaint,
    observedLCP: obs.observedLargestContentfulPaint,
    observedLoad: obs.observedLoad,
    totalKB: kb(a['total-byte-weight'].numericValue),
    requests: reqs.length,
    jsKB: kb(byType.Script),
    cssKB: kb(byType.Stylesheet),
    fontKB: kb(byType.Font),
    imgKB: kb(byType.Image),
    docKB: kb(byType.Document),
    otherKB: kb(Object.entries(byType).filter(([t]) => !['Script', 'Stylesheet', 'Font', 'Image', 'Document'].includes(t)).reduce((s, [, v]) => s + v, 0)),
    fonts: reqs.filter((q) => q.resourceType === 'Font').map((q) => ({ url: base(q.url), transferKB: +(q.transferSize / 1024).toFixed(1), resourceKB: +(q.resourceSize / 1024).toFixed(1), priority: q.priority, preload: q.isLinkPreload ?? null, endMs: Math.round(q.networkEndTime ?? 0) })),
    scripts: reqs.filter((q) => q.resourceType === 'Script').map((q) => `${base(q.url).split('/').pop()} ${(q.transferSize / 1024).toFixed(1)}`),
    domSize: a['dom-size-insight']?.numericValue ?? a['dom-size']?.numericValue,
    lcpElement: { selector: node?.selector, label: node?.nodeLabel, snippet: node?.snippet, parts },
    benchmarkIndex: r.environment.benchmarkIndex,
    warnings: r.runWarnings,
    failed: Object.fromEntries(
      ['accessibility', 'best-practices', 'seo'].map((cat) => [
        cat,
        r.categories[cat].auditRefs
          .map((x) => r.audits[x.id])
          .filter((x) => x.score !== null && x.score < 1 && !['informative', 'notApplicable', 'manual'].includes(x.scoreDisplayMode))
          .map((x) => x.id),
      ]),
    ),
    opportunities: r.categories.performance.auditRefs
      .map((x) => r.audits[x.id])
      .filter((x) => x && x.score !== null && x.score < 1 && !['notApplicable', 'numeric', 'informative', 'manual'].includes(x.scoreDisplayMode))
      .map((x) => `${x.id}${x.displayValue ? ' (' + x.displayValue + ')' : ''}${x.metricSavings ? ' ' + JSON.stringify(Object.fromEntries(Object.entries(x.metricSavings).filter(([, v]) => v))) : ''}`),
  }
}

const runs = []
for (const f of readdirSync(new URL('./lh/', import.meta.url)).filter((f) => prefixes.some((p) => f.startsWith(p + '-')) && f.endsWith('.json')).sort()) {
  runs.push(one(f, JSON.parse(readFileSync(`${OUT}/lh/${f}`))))
}

const groupStats = (rows) => {
  if (!rows.length) return null
  const med = {}
  for (const k of ['LCP', 'FCP', 'TBT', 'CLS', 'SI', 'TTI', 'observedFCP', 'observedLCP', 'totalKB', 'requests', 'jsKB', 'cssKB', 'fontKB', 'imgKB', 'docKB', 'benchmarkIndex']) med[k] = median(rows.map((r) => r[k]))
  med.scores = Object.fromEntries(Object.keys(rows[0].scores).map((c) => [c, median(rows.map((r) => r.scores[c]))]))
  // LCP-элемент и рекомендации — из прогона, ближайшего к медиане LCP
  const mid = [...rows].sort((a, b) => Math.abs(a.LCP - med.LCP) - Math.abs(b.LCP - med.LCP))[0]
  return { n: rows.length, files: rows.map((r) => r.file), median: med, medianRun: mid.file, lcpElement: mid.lcpElement, fonts: mid.fonts, scripts: mid.scripts, opportunities: mid.opportunities, failed: mid.failed }
}

const groups = {}
for (const form of ['mobile', 'desktop']) {
  const rows = runs.filter((r) => r.form === form)
  groups[`${form}-all`] = groupStats(rows)
  for (const mode of ['delayed', 'immediate']) groups[`${form}-${mode}`] = groupStats(rows.filter((r) => r.mode === mode))
}

// Прошлый замер (checklist, «после»): ab1 — первый кадр задержан, ab2 — сразу
const prev = JSON.parse(readFileSync(new URL('../checklist/lh-summary.json', import.meta.url))).runs
const prevMed = Object.fromEntries(
  Object.entries(prev)
    .filter(([k]) => k.endsWith('-after'))
    .map(([k, rows]) => [k, Object.fromEntries(['LCP', 'FCP', 'TBT', 'CLS', 'SI', 'jsKB', 'observedFCP'].map((m) => [m, median(rows.map((r) => r[m]))]).concat([['performance', median(rows.map((r) => r.scores.performance))]]))]),
)

const out = { prefixes, runs, groups, previous: prevMed }
save(`lh/summary-${prefixes.join('')}.json`, out)
const f = (x, d = 0) => (x === null || x === undefined ? '—' : typeof x === 'number' ? x.toFixed(d) : x)
for (const r of runs) console.log(r.file.padEnd(20), r.mode.padEnd(9), `perf ${r.scores.performance} a11y ${r.scores.accessibility} bp ${r.scores['best-practices']} seo ${r.scores.seo}`, `LCP ${f(r.LCP)} FCP ${f(r.FCP)} TBT ${f(r.TBT)} CLS ${f(r.CLS, 3)} SI ${f(r.SI)} | obsFCP ${f(r.observedFCP)} obsLCP ${f(r.observedLCP)} | ${r.totalKB} КБ, JS ${r.jsKB}, шрифты ${r.fontKB}, bi ${r.benchmarkIndex}`)
for (const [k, g] of Object.entries(groups)) if (g) console.log(k.padEnd(18), `n=${g.n}`, JSON.stringify(g.median), '\n   LCP-эл.:', g.lcpElement.selector, '«' + (g.lcpElement.label ?? '').slice(0, 60) + '»', JSON.stringify(g.lcpElement.parts))
console.log('прошлый замер:', JSON.stringify(prevMed, null, 1))
