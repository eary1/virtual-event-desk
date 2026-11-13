import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArticle } from './guides.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'content','articles');
const index=await readFile(path.join(root,'public/guides/index.html'),'utf8');
const sitemap=await readFile(path.join(root,'public/sitemap.xml'),'utf8');
const files=(await readdir(dir)).filter(name=>name.endsWith('.json')).sort();

test('all article records meet publishing schema', async()=>{
  for(const name of files){
    const article=JSON.parse(await readFile(path.join(dir,name),'utf8'));
    assert.deepEqual(validateArticle(article),[],name+' is invalid');
  }
});

test('draft articles are not published or indexed', async()=>{
  for(const name of files){
    const article=JSON.parse(await readFile(path.join(dir,name),'utf8'));
    if(article.status!=='draft')continue;
    assert.equal(article.review?.factsChecked,false,name+' must not claim fact review');
    assert.equal(article.review?.rightsChecked,false,name+' must not claim rights review');
    assert.equal(article.review?.editorApproved,false,name+' must not claim editorial approval');
    assert.equal(article.review?.reviewedOn,'',name+' must not have a review date');
    const articleUrl='/guides/'+article.slug+'/';
    assert.ok(!index.includes('href="'+articleUrl+'"'),name+' draft was added to article index');
    assert.ok(!sitemap.includes(articleUrl),name+' draft was added to sitemap');
    const output=path.join(root,'public','guides',article.slug,'index.html');
    await assert.rejects(readFile(output,'utf8'),{code:'ENOENT'},name+' draft has a public HTML page');
  }
});
