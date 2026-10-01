// Общее для итогового замера: браузеры, адрес, папка результатов, прокрутка. Основа — verify/lib.mjs.
import { chromium, webkit } from '/home/coder/novi/render-lab/node_modules/playwright-core/index.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const BASE = 'http://localhost:3100'
export const OUT = path.dirname(fileURLToPath(import.meta.url))
export const CHROME = '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome'
// lighthouse и axe-core: `npm i lighthouse axe-core` в этой папке (или задать MODS)
export const MODS = process.env.MODS ?? '/tmp/claude-1001/-home-coder-novi/bfc0bfb6-05b9-4e57-869a-a26cb55cba25/scratchpad/final/node_modules'
export const LEADS = '/tmp/claude-1001/-home-coder-novi/bfc0bfb6-05b9-4e57-869a-a26cb55cba25/scratchpad/leads/leads.log'

export const launch = (name = 'chromium') =>
  name === 'webkit' ? webkit.launch() : chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })

export function save(rel, data) {
  const file = path.join(OUT, rel)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2))
  return file
}

/** Прокрутка до низа шагами по 70 % экрана и обратно наверх. */
export async function scrollThrough(page, { pause = 120, back = true } = {}) {
  await page.evaluate(
    async ({ pause, back }) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const step = Math.round(innerHeight * 0.7)
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' })
        await sleep(pause)
      }
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      await sleep(pause * 4)
      if (back) window.scrollTo({ top: 0, behavior: 'instant' })
      await sleep(pause)
    },
    { pause, back },
  )
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
