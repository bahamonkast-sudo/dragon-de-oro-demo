// Harness: ejecuta public/temario.js con DOM simulado contra el server real.
'use strict';
console.log('node', process.version);
function makeEl(id) {
  return {
    id, className: '', textContent: '', _html: '',
    classList: { add() {}, remove() {} },
    addEventListener() {},
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html; },
    insertAdjacentHTML(p, h) { this._html += h; },
  };
}
const ids = {};
global.document = { getElementById: (id) => ids[id] || (ids[id] = makeEl(id)) };
const fs = require('fs');
let code = fs.readFileSync('public/temario.js', 'utf8');
code += ';global.__tabs=[document.getElementById("syllabusTab1"),document.getElementById("syllabusTab2"),document.getElementById("syllabusTab3")];';
code = code.replace(
  "fetch('data/course_data.json'",
  "fetch('http://127.0.0.1:3000/public/data/course_data.json'"
);
(async () => {
  eval(code);
  await new Promise((r) => setTimeout(r, 3000));
  global.__tabs.forEach((t, i) => {
    const n = (t._html.match(/curso\.html#n\d+-\d+/g) || []).length;
    console.log('tab' + (i + 1) + ': ' + n + ' enlaces | html chars: ' + t._html.length);
  });
  console.log('btn1:', ids.tabBtn1.textContent);
  console.log('btn2:', ids.tabBtn2.textContent);
  console.log('btn3:', ids.tabBtn3.textContent);
})();
