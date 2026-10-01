// Сводка Lighthouse: медианы метрик и баллов по 3 прогонам, элемент LCP, вес, запросы, топ рекомендаций.
import { readFileSync } from 'node:fs'
import { save } from './lib.mjs'

const load = (f) => JSON.parse(readFileSync(new URL(`./lh/${f}.json`, import.meta.url)))
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

function one(r) {
  const a = r.audits
  const reqs = a['network-requests'].details.items
  const kb = (n) => Math.round(n / 1024)
  const byType = {}
  for (const q of reqs) byType[q.resourceType] = (byType[q.resourceType] ?? 0) + (q.transferSize ?? 0)
  const obs = a.metrics.details.items[0]
  return {
    scores: Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
    LCP: a['largest-contentful-paint'].numericValue,
    FCP: a['first-contentful-paint'].numericValue,
    TBT: a['total-blocking-time'].numericValue,
    CLS: a['cumulative-layout-shift'].numericValue,
    SI: a['speed-index'].numericValue,
    TTI: a.interactive?.numericValue,
    observedLCP: obs.observedLargestContentfulPaint,
    observedFCP: obs.observedFirstContentfulPaint,
    observedLoad: obs.observedLoad,
    totalKB: kb(a['total-byte-weight'].numericValue),
    requests: reqs.length,
    jsKB: kb(byType.Script ?? 0),
    cssKB: kb(byType.Stylesheet ?? 0),
    fontKB: kb(byType.Font ?? 0),
    imgKB: kb(byType.Image ?? 0),
    docKB: kb(byType.Document ?? 0),
    benchmarkIndex: r.environment.benchmarkIndex,
  }
}

function lcpElement(r) {
  const d = r.audits['lcp-breakdown-insight']?.details
  const node = d?.items?.find((i) => i.type === 'node')
  const parts = d?.items?.find((i) => i.type === 'table')?.items?.map((p) => `${p.label} ${Math.round(p.duration)} мс`)
  return { selector: node?.selector, label: node?.nodeLabel, snippet: node?.snippet, parts }
}

function opportunities(r) {
  const refs = r.categories.performance.auditRefs.map((x) => x.id)
  return refs
    .map((id) => r.audits[id])
    .filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'numeric')
    .map((a) => ({
      id: a.id,
      title: a.title,
      display: a.displayValue,
      score: a.score,
      metricSavings: a.metricSavings,
      savingsMs: a.details?.overallSavingsMs,
      savingsKB: a.details?.overallSavingsBytes ? Math.round(a.details.overallSavingsBytes / 1024) : undefined,
    }))
    .sort((x, y) => {
      const w = (o) => Math.max(o.metricSavings?.LCP ?? 0, o.metricSavings?.FCP ?? 0, o.metricSavings?.TBT ?? 0, o.savingsMs ?? 0) * 1000 + (o.savingsKB ?? 0)
      return w(y) - w(x)
    })
}

const out = {}
for (const form of ['mobile', 'desktop']) {
  const runs = [1, 2, 3].map((i) => load(`lh-${form}-${i}`))
  const rows = runs.map(one)
  const med = {}
  for (const k of Object.keys(rows[0])) {
    if (k === 'scores') {
      med.scores = Object.fromEntries(Object.keys(rows[0].scores).map((c) => [c, median(rows.map((r) => r.scores[c]))]))
    } else med[k] = median(rows.map((r) => r[k] ?? 0))
  }
  // Рекомендации и LCP-элемент — из прогона с медианным LCP.
  const mid = rows.findIndex((r) => r.LCP === med.LCP)
  const failedA11y = (r) =>
    r.categories.accessibility.auditRefs
      .map((x) => r.audits[x.id])
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary')
      .map((a) => ({ id: a.id, title: a.title, items: a.details?.items?.map((i) => i.node?.selector ?? i.node?.snippet) }))
  const failedOther = (r, cat) =>
    r.categories[cat].auditRefs
      .map((x) => r.audits[x.id])
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
      .map((a) => ({ id: a.id, title: a.title, display: a.displayValue, items: a.details?.items?.slice(0, 5) }))
  out[form] = {
    runs: rows,
    median: med,
    medianRun: mid + 1,
    lcpElement: lcpElement(runs[mid]),
    opportunities: opportunities(runs[mid]).slice(0, 10),
    a11yFailed: failedA11y(runs[mid]),
    bpFailed: failedOther(runs[mid], 'best-practices'),
    seoFailed: failedOther(runs[mid], 'seo'),
    warnings: runs.flatMap((r) => r.runWarnings),
  }
}
for (const p of ['privacy', 'lead-sent', 'lead-error']) {
  try {
    const r = load(`lh-a11y-${p}`)
    out[`a11y-${p}`] = {
      scores: Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
      a11yFailed: r.categories.accessibility.auditRefs
        .map((x) => r.audits[x.id])
        .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary')
        .map((a) => ({ id: a.id, title: a.title, items: a.details?.items?.map((i) => i.node?.selector) })),
      seoFailed: r.categories.seo.auditRefs
        .map((x) => r.audits[x.id])
        .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable')
        .map((a) => ({ id: a.id, title: a.title, display: a.displayValue })),
    }
  } catch (e) {
    out[`a11y-${p}`] = String(e)
  }
}
save('lh/summary.json', out)
console.log(JSON.stringify(out, null, 1))
