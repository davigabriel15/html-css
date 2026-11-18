/* EcoVision IA — lógica da demonstração.
   TUDO É SIMULADO: a classificação vem do objeto escolhido, não de uma IA/câmera real. */

// --- Dados -----------------------------------------------------------------
const BINS = [
  {id:'plastico', n:'Plástico', c:'#f5c518'}, {id:'papel', n:'Papel', c:'#2f7de1'},
  {id:'metal', n:'Metal', c:'#f28c28'},       {id:'vidro', n:'Vidro', c:'#2e9e5b'},
  {id:'organico', n:'Orgânico', c:'#8b5a2b'}, {id:'rejeito', n:'Rejeito', c:'#8d98a3'}
];
const ITEMS = [
  {n:'Garrafa PET', i:'🧴', b:'plastico', m:'Plástico (PET)'},
  {n:'Caixa de papelão', i:'📦', b:'papel', m:'Papelão'},
  {n:'Lata de alumínio', i:'🥫', b:'metal', m:'Metal (alumínio)'},
  {n:'Garrafa de vidro', i:'🍾', b:'vidro', m:'Vidro'},
  {n:'Casca de banana', i:'🍌', b:'organico', m:'Resíduo orgânico'},
  {n:'Luva descartável', i:'🧤', b:'rejeito', m:'Rejeito (não reciclável)'}
];

// --- Estado e elementos ------------------------------------------------------
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const stage = $('#stage'), belt = $('#belt'), scanner = $('#scanner');
const counts = Object.fromEntries(BINS.map(b => [b.id, 0]));
let sel = 0, busy = false;

// --- Montagem da interface -----------------------------------------------------
$('#bins').innerHTML = BINS.map(b =>
  `<div class="bin" id="bin-${b.id}" style="--c:${b.c}"><div class="cnt" id="c-${b.id}">0</div><div class="lid"></div><div class="body">♻</div><div class="lbl">${b.n}</div></div>`).join('');
$('#picks').innerHTML = ITEMS.map((it, k) =>
  `<button class="pick${k ? '' : ' sel'}" data-k="${k}"><span>${it.i}</span>${it.n}</button>`).join('');
$('#minis').innerHTML = BINS.map(b =>
  `<div class="mini" style="--c:${b.c}"><b id="m-${b.id}">0</b>${b.n}</div>`).join('');

$('#picks').onclick = e => {
  const btn = e.target.closest('.pick'); if (!btn || busy) return;
  sel = +btn.dataset.k;
  document.querySelectorAll('.pick').forEach(p => p.classList.toggle('sel', p === btn));
};
$('#go').onclick = run;
$('#reset').onclick = () => { if (busy) return; BINS.forEach(b => counts[b.id] = 0); render(); info('Aguardando resíduo', '—', '—'); };

// --- Utilitários -------------------------------------------------------------
const pos = el => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return {x: r.left - s.left + r.width / 2, y: r.top - s.top}; };
const setStep = n => document.querySelectorAll('#steps li').forEach((li, i) => li.className = i + 1 < n ? 'done' : i + 1 === n ? 'on' : '');
function info(stat, mat, res) { $('#stat').textContent = stat; if (mat != null) $('#mat').textContent = mat; if (res != null) $('#res').textContent = res; $('#status').textContent = stat; }
function render() {
  let t = 0;
  BINS.forEach(b => { t += counts[b.id]; $('#c-' + b.id).textContent = counts[b.id]; $('#m-' + b.id).textContent = counts[b.id]; });
  $('#total').textContent = t;
}
function lock(v) { busy = v; $('#go').disabled = v; document.querySelectorAll('.pick').forEach(p => p.disabled = v); $('#pill').classList.toggle('run', v); }
// Move o resíduo (centralizado em x) com transição CSS
function go(it, x, y, ms, ease = 'linear') {
  it.style.transition = `left ${ms}ms ${ease},top ${ms}ms ${ease},transform ${ms}ms,opacity ${ms}ms`;
  it.style.left = (x - it.offsetWidth / 2) + 'px';
  if (y != null) it.style.top = y + 'px';
  return sleep(ms);
}

// --- Fluxo da triagem --------------------------------------------------------
async function run() {
  if (busy) return;
  const d = ITEMS[sel], bin = BINS.find(b => b.id === d.b), binEl = $('#bin-' + bin.id);
  lock(true); info('Recebendo resíduo', '—', '—'); setStep(1);

  // 1. Resíduo entra na esteira
  const it = document.createElement('div'); it.className = 'item'; it.textContent = d.i; stage.append(it);
  const w = it.offsetWidth, y = belt.offsetTop - w + 6, sx = pos(scanner).x, bx = pos(binEl).x;
  it.style.transition = 'none'; it.style.top = y + 'px'; it.style.left = -w + 'px'; void it.offsetWidth;
  belt.classList.remove('stop');

  // 2. Transporte até o scanner e parada
  info('Transportando até o scanner');
  await go(it, sx, y, Math.max(700, (sx + w) / 0.18));
  belt.classList.add('stop'); setStep(2); info('Esteira parada no scanner'); await sleep(600);

  // 3. Análise (simulada)
  setStep(3); scanner.classList.add('on');
  for (const m of ['Capturando imagem (simulado)…', 'Analisando forma e textura…', 'Comparando padrões (simulado)…']) { info(m); await sleep(750); }
  scanner.classList.remove('on');

  // 4. Identificação
  setStep(4); const conf = 93 + Math.floor(Math.random() * 6);
  info('Material identificado', d.m, `Lixeira ${bin.n} · confiança ${conf}% (simulada)`);
  binEl.classList.add('target'); await sleep(1100);

  // 5. Esteira retoma e encaminha à lixeira
  setStep(5); belt.classList.remove('stop'); info('Encaminhando para a lixeira ' + bin.n);
  await go(it, bx, y, Math.max(700, Math.abs(bx - sx) / 0.18));
  binEl.classList.add('open'); await sleep(350);
  const p = go(it, bx, pos(binEl).y + 28, 600, 'ease-in');   // queda dentro da lixeira
  it.style.transform = 'scale(.35)'; it.style.opacity = 0; await p;

  // 6. Contabiliza e destaca
  counts[bin.id]++; render();
  binEl.classList.remove('target', 'open'); binEl.classList.add('hit'); belt.classList.add('stop');
  it.remove(); info('Triagem concluída: ' + bin.n); setStep(6);
  await sleep(1400); binEl.classList.remove('hit');
  setStep(0); info('Aguardando resíduo'); lock(false);
}
render();
