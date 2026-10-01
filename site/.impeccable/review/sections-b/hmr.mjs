// Тестовая вкладка не подхватывает правки соседей на общем dev-сервере: сокет HMR проксируется,
// но сообщения, которые меняют код или перезагружают страницу, отбрасываются. Остальное (в т. ч.
// отладочный канал RSC, без которого страница не гидратируется) проходит как есть.
const DROP = /^\{"type":"(turbopack-message|serverComponentChanges|reloadPage|serverOnlyChanges|addedPage|removedPage|devPagesManifestUpdate)"/
export async function freezeHmr(context) {
  await context.routeWebSocket(/_next\/webpack-hmr/, (ws) => {
    const server = ws.connectToServer()
    server.onMessage((m) => {
      if (typeof m === 'string' && DROP.test(m)) return
      ws.send(m)
    })
    ws.onMessage((m) => server.send(m))
  })
}
