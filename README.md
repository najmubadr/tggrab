# tggrab

## Как пользоваться:
  1. открой Saved Messages в Telegram Web.
  2. вставь скрипт в DevTools → Console, Enter.
  3. вызови TGGrab.start() — и листай историю вверх/вниз, пока не наберёшь всё, что нужно.
  4. по ходу можно смотреть TGGrab.stats() — сколько собрано.
  5. когда готов — TGGrab.exportJSON() (или просто нажми Ctrl+Shift+S) и у тебя скачается telegram_saved_export_*.json.
  6. TGGrab.stop() чтобы остановить сбор.
