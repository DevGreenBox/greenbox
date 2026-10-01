#!/usr/bin/env bash
# Остальные браузерные проверки строго по очереди (один браузер за раз). Логи — рядом с результатами.
cd "$(dirname "$0")"
# Машина общая с параллельными агентами (лимит 8 ГБ): перед шагом ждём, пока занятая память не опустится ниже 7 ГБ (до 30 мин).
gate() { for i in $(seq 1 900); do a=$(awk '/^anon /{print int($2/1048576)}' /sys/fs/cgroup/memory.stat); [ "$a" -lt 7000 ] && return; sleep 2; done; echo "   память так и не освободилась: ${a} МБ"; }
step() { local log=$1; shift; gate; echo "== $(date +%T) $* (anon $(awk '/^anon /{print int($2/1048576)}' /sys/fs/cgroup/memory.stat) МБ)"; timeout 1500 node "$@" > "$log" 2>&1; echo "   exit $? → $log"; }
step xbrowser/run-chromium.log xbrowser.mjs chromium
step xbrowser/run-webkit.log xbrowser.mjs webkit
step xbrowser/webkit-scroll.log webkit-scroll.mjs
step motion/run.log motion.mjs
step forms/nojs-run.log nojs-form.mjs
step kbd/run.log kbd.mjs
step cases/run.log cases-check.mjs
step forms/run.log forms.mjs
step lcp/run.log lcp-entries.mjs
echo "== $(date +%T) ВСЁ"
