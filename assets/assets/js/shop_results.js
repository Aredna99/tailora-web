// Estrae i prodotti dalla pagina di Google Shopping (tab udm=28).
// Restituisce JSON: [{index, title, price, oldPrice, merchant, image, link}].
// Si basa su testi e attributi di accessibilità (più stabili delle classi CSS).
(() => {
  const PRICE = /\d[\d.]*(,\d{2})?\s?€/;
  const SKIP = /^(IN PROMOZIONE|IN SALDO|NUOVO|In negozio|Nelle vicinanze|Resi|Consegna|Spedizione|Disponibile|\+|\d[,.]\d\s*\()/i;
  const lines = (el) => (el.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
  // Prima un'immagine https, poi una inline (webp/jpeg/png); i GIF sono
  // segnaposto delle immagini caricate allo scorrimento.
  const image = (el) => {
    const srcs = [...el.querySelectorAll('img')]
      .filter((i) => (i.width || 0) > 40)
      .flatMap((i) => [i.getAttribute('src'), i.getAttribute('data-src')])
      .filter(Boolean);
    return srcs.find((s) => /^https:/.test(s)) ||
      srcs.find((s) => /^data:image\/(webp|jpeg|png)/.test(s)) || null;
  };
  const parse = (lns) => {
    const p = lns.findIndex((l) => PRICE.test(l) && !l.startsWith('+'));
    if (p < 1) return null;
    const title = lns.slice(0, p).filter((l) => !SKIP.test(l) && l !== l.toUpperCase()).pop();
    const old = PRICE.test(lns[p + 1] || '') ? lns[p + 1] : null;
    const merchant = lns.slice(p + 1).find((l) => !PRICE.test(l) && !SKIP.test(l)) || '';
    return title ? { title, price: lns[p].match(PRICE)[0], oldPrice: old, merchant } : null;
  };
  const out = [];
  // Risultati normali: si aprono nel pannello offerte di Google.
  document.querySelectorAll('[jsname="QS8Cxb"][data-pv="1"]').forEach((card, index) => {
    const info = parse(lines(card));
    if (info) out.push({ index, ...info, image: image(card), link: null });
  });
  // Annunci: il link porta direttamente al negozio.
  document.querySelectorAll('a.pla-unit[href]').forEach((a) => {
    const info = parse(lines(a));
    if (info) out.push({ index: -1, ...info, merchant: info.merchant || a.dataset.dtld || '', image: image(a), link: a.href });
  });
  const seen = new Set();
  return JSON.stringify(out.filter((p) => {
    const key = `${p.title}|${p.merchant}|${p.price}`;
    return !seen.has(key) && seen.add(key);
  }));
})()
