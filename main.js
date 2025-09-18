(() => {
  const SELECTOR = '.message-content-wrapper .message-content';

  // ==== внутреннее хранилище ====
  const state = {
    map: new Map(), // id -> record
    observer: null,
    running: false,
  };

  // простая хеш-функция для дедупликации по тексту (djb2)
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(36);
  }

  // извлечение всех URL из текста
  function extractUrls(text) {
    const re = /\bhttps?:\/\/[^\s)]+/gi;
    const urls = text.match(re) || [];
    // подчистим хвосты вроде ")," или ")."
    return urls.map(u => u.replace(/[),.]+$/,''));
  }

  // обработать DOM-элемент(ы) с сообщениями
  function processElements(els) {
    els.forEach(el => {
      try {
        // в выборе пользователя интересует только innerText
        const text = (el.innerText || '').trim();
        if (!text) return;

        const id = hash(text); // базовая дедупликация: по тексту
        if (state.map.has(id)) return;

        const urls = extractUrls(text);
        // можно добавить доп. атрибуты, если захотите (например, дата из соседних узлов)
        const record = {
          text,
          urls,
          capturedAt: new Date().toISOString()
        };

        state.map.set(id, record);
      } catch (_) {}
    });
  }

  // первичный прогон по уже отрендеренным сообщениям
  function initialScan() {
    const els = Array.from(document.querySelectorAll(SELECTOR));
    processElements(els);
  }

  // запуск наблюдателя за подгрузкой новых сообщений
  function start() {
    if (state.running) {
      console.log('[TGGrab] уже запущен');
      return;
    }
    initialScan();

    state.observer = new MutationObserver(mutations => {
      const added = [];
      for (const m of mutations) {
        m.addedNodes && m.addedNodes.forEach(node => {
          // если добавили узел-элемент — ищем внутри подходящие блоки
          if (node.nodeType === 1) {
            if (node.matches && node.matches(SELECTOR)) {
              added.push(node);
            } else {
              added.push(...node.querySelectorAll?.(SELECTOR) ?? []);
            }
          }
        });
      }
      if (added.length) processElements(added);
    });

    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    state.running = true;
    console.log('[TGGrab] сбор запущен. Скрольте чат — сообщения будут добавляться.');
  }

  // остановка наблюдателя
  function stop() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    state.running = false;
    console.log('[TGGrab] сбор остановлен.');
  }

  // выгрузка JSON
  function exportJSON() {
    const arr = Array.from(state.map.values());
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `telegram_saved_export_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
    console.log(`[TGGrab] экспортировано записей: ${arr.length}`);
  }

  // статистика и утилиты
  function stats() {
    console.table({
      collected: state.map.size,
      running: state.running
    });
  }
  function clearAll() {
    state.map.clear();
    console.log('[TGGrab] очищено локальное хранилище.');
  }

  // горячая клавиша: Ctrl+Shift+S — экспорт JSON
  function keyHandler(e) {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
      e.preventDefault();
      exportJSON();
    }
  }
  window.addEventListener('keydown', keyHandler);

  // публичный API на window
  window.TGGrab = { start, stop, exportJSON, stats, clearAll };

  console.log('%c[TGGrab] готов к работе.\nКоманды: TGGrab.start(), TGGrab.stop(), TGGrab.exportJSON(), TGGrab.stats(), TGGrab.clearAll()',
              'color:#16a34a;font-weight:700;');
})();
