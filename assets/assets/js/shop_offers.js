// Legge le offerte dal pannello prodotto aperto (quello visibile a schermo):
// JSON [{merchant, price, link}] con link diretto alla pagina del negozio.
(() => {
  const PRICE = /\d[\d.]*(,\d{2})?\s?€/;
  // Etichette che Google mette prima del nome del negozio.
  const SKIP = /^(Nelle vicinanze|In saldo|In negozio|Miglior prezzo|Prezzo migliore|Prezzo più basso|Più venduto|Popolare|Best price|\s*)$/i;
  const w = window.innerWidth;
  const seen = new Set();
  const out = [];
  document.querySelectorAll('[role="dialog"] [role="listitem"] a[href]').forEach((a) => {
    let host;
    try { host = new URL(a.href).hostname; } catch { return; }
    if (/google\.|gstatic|youtube/.test(host)) return;
    const r = a.getBoundingClientRect();
    if (r.width === 0 || r.x < 0 || r.x >= w) return; // pannelli di altri prodotti
    const item = a.closest('[role="listitem"]');
    const lns = (item.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const price = lns.find((l) => PRICE.test(l));
    const merchant = lns.find((l) => !PRICE.test(l) && !SKIP.test(l)) || host;
    if (!price || seen.has(a.href)) return;
    seen.add(a.href);
    out.push({ merchant, price: price.match(PRICE)[0], link: a.href });
  });
  return JSON.stringify(out);
})()
