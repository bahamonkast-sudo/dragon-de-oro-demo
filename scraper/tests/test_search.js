// Test del buscador del LMS. Extrae las funciones reales de public/index.html y
// las ejecuta en Node inyectandoles sus dependencias, porque eval() no captura
// el objeto de contexto del archivo.
const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];

// Corta una funcion por nombre respetando las llaves anidadas.
function grab(name) {
  const i = js.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('no existe ' + name);
  let d = 0, on = false;
  for (let j = i; j < js.length; j++) {
    if (js[j] === '{') { d++; on = true; }
    else if (js[j] === '}') { d--; if (on && d === 0) return js.slice(i, j + 1); }
  }
  throw new Error('llaves sin cerrar en ' + name);
}

const idx = JSON.parse(fs.readFileSync('data/parsed/search_index.json', 'utf8'));

// search() real, con las dependencias接到 parametros y devolviendo el mapa.
const searchBody = grab('search')
  .replace(/^function search\(q\)/, 'function search(q, plain, norm, occurrences, INDEX)')
  .replace(/\bhits = new Map\(\);/, 'const hits = new Map();')
  .replace(/if \(!terms\.length\) return;/, 'if (!terms.length) return hits;')
  .replace(/^\}$/m, '  return hits;\n}');

const DEP = {
  plain: (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  norm: (u) => String(u || '').split('#')[0].replace(/\/+$/, '/'),
  occurrences: eval('(' + grab('occurrences') + ')'),
  INDEX: idx.entries,
};

const names = Object.keys(DEP);
const vals = names.map((n) => DEP[n]);
const search = eval('(' + searchBody.replace(/^function search/, 'function') + ')');

let fallos = 0;
const run = (q) => search.apply(null, [q, ...vals]);

console.log('--- busqueda multi-termino (AND) ---');
const casos = [
  ['velas japonesas', true],
  ['doji', true],
  ['patron envolvente', true],  // antes 0 por busqueda literal
  ['envolvente', true],
  ['gestion riesgo', true],     // sin "del"
  ['contrato', true],
  ['tecnica', true],            // sin tilde
  ['VELAS JAPONESAS', true],    // mayusculas
  ['patrulla peninsula', false],
  ['x', false],                 // termino de 1 letra
  ['zzzznoexiste', false],
];

for (const [q, debe] of casos) {
  const n = run(q).size;
  const ok = (n > 0) === debe;
  if (!ok) fallos++;
  const top = [...run(q)].sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([u, c]) => c + 'x ' + u.split('/').pop().slice(0, 38));
  console.log((ok ? 'OK   ' : 'FALLA') + ' "' + q + '" -> ' + n + (n ? '  [' + top.join(' | ') + ']' : ''));
}

const a = run('tecnica').size, b = run('técnica').size;
console.log('\nacentos: ' + (a === b && a > 0 ? 'OK   ' + a + ' en ambos' : 'FALLA ' + a + ' vs ' + b));
if (!(a === b && a > 0)) fallos++;

console.log('\n--- robustez ---');
const raros = ['', '   ', 'a', '%%', '123', '😀', 'velas  japonesas', '  doji  ', 'doji doji'];
let roto = 0;
for (const q of raros) {
  try { run(q); } catch (e) { console.log('FALLA ' + JSON.stringify(q) + ': ' + e.message); roto++; fallos++; }
}
console.log(roto ? roto + ' excepciones' : 'OK   ' + raros.length + ' entradas raras sin excepcion');

console.log('\n--- snippet ---');
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const snippet = eval('(function(text, q, plain, esc) {' +
  grab('snippet').replace(/^function snippet\(text, q\)/, '') + '})');

const e1 = idx.entries.find((e) => /envolvente/i.test(e.text));
const s1 = snippet(e1.text, 'envolvente', DEP.plain, esc);
const ok1 = /<mark[^>]*>envolvente<\/mark>/.test(s1);
console.log((ok1 ? 'OK   ' : 'FALLA') + ' resalta la coincidencia');
if (!ok1) fallos++;

// El recorte debe caer sobre el mismo texto que se resalta, sin desalinearse.
// Se elige una entrada cuyo primer "envolvente" este bien dentro del texto,
// para que el recorte de 180 caracteres tenga que recortar por los dos lados.
const e2 = idx.entries
  .filter((e) => /envolvente/i.test(e.text))
  .sort((a, b) => b.text.length - a.text.length)[0];
const pos = e2.text.search(/envolvente/i);
const s2 = snippet(e2.text, 'envolvente', DEP.plain, esc);
const limpio = s2.replace(/<[^>]+>/g, '').replace(/^…/, '').replace(/…$/, '');
// La busqueda es insensible a mayusculas, asi que el recorte tambien puede
// traer "Envolvente": se compara en minusculas.
const dentro = pos > 100 && limpio.toLowerCase().indexOf('envolvente') !== -1 && limpio.length <= 200;
console.log((dentro ? 'OK   ' : 'FALLA') + ' recorte alineado (texto de ' + e2.text.length +
  ' chars, hallazgo en ' + pos + ', snippet de ' + limpio.length + ')');
console.log('  ' + limpio.slice(0, 120) + '…');
if (!dentro) fallos++;

console.log('\n--- integridad del indice ---');
const cd = JSON.parse(fs.readFileSync('data/parsed/course_data.json', 'utf8'));
const urls = new Set([DEP.norm(cd.course_page.url)]);
for (const lv of cd.levels) for (const c of [...lv.classes, ...lv.video_classes]) urls.add(DEP.norm(c.url));
for (const e of cd.extras) urls.add(DEP.norm(e.url));
const huerf = idx.entries.filter((e) => !urls.has(DEP.norm(e.url)));
const vacias = idx.entries.filter((e) => !e.text.trim());
console.log((!huerf.length ? 'OK   ' : 'FALLA') + ' entradas huerfanas: ' + huerf.length);
console.log((!vacias.length ? 'OK   ' : 'FALLA') + ' entradas sin texto: ' + vacias.length);
if (huerf.length || vacias.length) fallos++;

console.log('\n' + (fallos ? fallos + ' FALLOS' : 'TODO CORRECTO'));
process.exit(fallos ? 1 : 0);
