# Выкат сайта на свой сервер

Боевой сервер — **130.49.143.37** (`ssh greenbox-srv`), каталог `/opt/greenbox`.
Что именно требуется от выката по существу (standalone целиком, X-Forwarded-For
перезаписью, лог заявок вне папки сборки, атомарная подмена релиза) — описано в
[`../docs/04-handoff.md`](../docs/04-handoff.md); здесь — как это сделано на этой машине.

## Устройство

```
/opt/greenbox/
├── docker-compose.yml      два контейнера: app (node:24-slim) и caddy
├── caddy/
│   ├── Caddyfile           действующий конфиг
│   └── Caddyfile.domain-ready   доменный режим с HTTPS
├── app.env                 секреты (600): токен бота, chat_id, ACME_EMAIL
├── releases/<метка>/       распакованные сборки, хранятся последние три
├── current -> releases/…   симлинк на действующий релиз
└── data/leads.log          лог заявок — вне папки сборки, подмена релиза его не трогает
```

Сборка идёт **на машине разработки** (`pnpm build` в `site/`), на сервер едет
готовая папка `.next/standalone`. На сервере нет ни Node, ни pnpm — и не нужны:
standalone самодостаточен, Node даёт официальный образ.

Версия Node в образе (24.x, glibc) совпадает с той, на которой шла сборка:
бинарники `sharp` в standalone собраны под конкретную платформу, на alpine/musl
они не запустятся.

## Обычный выкат

```bash
# 1. На машине разработки: проверки и сборка
cd site && pnpm lint && pnpm typecheck && pnpm test && pnpm build
TS=$(date +%Y%m%d-%H%M%S)
tar -czf /tmp/greenbox-$TS.tar.gz -C .next/standalone .
scp /tmp/greenbox-$TS.tar.gz greenbox-srv:/tmp/

# 2. На сервере: распаковать в новый релиз и перевесить симлинк
ssh greenbox-srv "mkdir -p /opt/greenbox/releases/$TS && tar -xzf /tmp/greenbox-$TS.tar.gz -C /opt/greenbox/releases/$TS && chown -R 1000:1000 /opt/greenbox/releases/$TS && ln -sfn /opt/greenbox/releases/$TS /opt/greenbox/current && cd /opt/greenbox && docker compose up -d --force-recreate app"
```

Подмена именно такая — новый релиз рядом, затем симлинк: `rm -rf` в живой папке
отдавал бы 502 всем посетителям на время распаковки.

`--force-recreate`, а не `restart`: контейнер держит bind-mount по старому пути,
перезапуск оставил бы прежний релиз.

## Откат

Перевесить симлинк на предыдущий релиз и пересоздать контейнер:

```bash
ssh greenbox-srv 'ls -1 /opt/greenbox/releases'      # выбрать предыдущий
ssh greenbox-srv 'ln -sfn /opt/greenbox/releases/<метка> /opt/greenbox/current && cd /opt/greenbox && docker compose up -d --force-recreate app'
```

Заявки при откате не теряются: `data/leads.log` живёт вне папок релизов.

## Включение HTTPS

Домен уже указывает на этот сервер (A-запись `greenboxweb.ru` и `www`,
Timeweb). Перед включением убедиться, что **AAAA-записи нет**: у сервера нет
IPv6, а Let's Encrypt предпочитает IPv6 — проверка ушла бы на старый хостинг.

```bash
cp /opt/greenbox/caddy/Caddyfile.domain-ready /opt/greenbox/caddy/Caddyfile
cd /opt/greenbox && docker compose up -d --force-recreate caddy
docker compose logs --tail 30 caddy     # certificate obtained
```

## Проверки после выката

```bash
curl -sI http://130.49.143.37/ | head -5
ssh greenbox-srv 'cd /opt/greenbox && docker compose ps'
ssh greenbox-srv 'tail -5 /opt/greenbox/data/leads.log'   # дошла ли тестовая заявка
```
