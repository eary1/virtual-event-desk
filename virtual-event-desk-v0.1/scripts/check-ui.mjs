import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const css = await readFile(path.join(root,'assets/style.css'),'utf8');
const home = await readFile(path.join(root,'index.html'),'utf8');

async function htmlPaths(dir) {
  const result = [];
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const target = path.join(dir,entry.name);
    if (entry.isDirectory()) result.push(...await htmlPaths(target));
    else if (entry.name.endsWith('.html')) result.push(target);
  }
  return result;
}
const paths = await htmlPaths(root);
for (const file of paths) {
  const html = await readFile(file,'utf8');
  assert.match(html,/<!doctype html>/i,file+' requires doctype');
  assert.match(html,/<meta name="viewport"/,file+' requires a responsive viewport');
  assert.match(html,/href="\/assets\/style\.css"/,file+' needs shared design stylesheet');
  assert.match(html,/<main\b/,file+' requires a main landmark');
  assert.match(html,/<\/main>/,file+' requires a closing main');
  assert.match(html,/<\/html>/,file+' requires a closing html');
  assert.ok((html.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g)||[]).length<=1,file+' duplicates analytics tag');
}
assert.equal((home.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g)||[]).length,1,'home needs exactly one analytics tag');

const opens=(css.match(/{/g)||[]).length;
const closes=(css.match(/}/g)||[]).length;
assert.equal(opens,closes,'CSS braces must balance');
assert.match(css,/\.article \.article-intro/,'article intro should be styled');
assert.match(css,/@media\(max-width:660px\)/,'mobile layout needs a breakpoint');
assert.match(css,/\.aside-card a\.btn/,'sidebar CTA contrast must not regress');

function color(name) {
  const m=css.match(new RegExp('--'+name+':(#[0-9a-fA-F]{6})'));
  assert.ok(m,'color '+name+' must exist');
  return m[1];
}
function luminance(hex) {
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const [r,g,b]=rgb.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
}
const a=luminance(color('primary')), b=luminance(color('primaryink'));
const contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
assert.ok(contrast>=4.5,'Primary button contrast must be >=4.5:1, actual '+contrast.toFixed(2));
console.log('UI static checks passed: '+paths.length+' HTML pages; CTA contrast '+contrast.toFixed(2)+':1');
