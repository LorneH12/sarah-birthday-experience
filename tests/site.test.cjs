const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const sandbox = {TextEncoder, URLSearchParams, console};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const name of fs.readdirSync(path.join(root,'data'))) vm.runInContext(fs.readFileSync(path.join(root,'data',name),'utf8'), sandbox);
for (const name of ['utils','ui','events','slideshow','services/contributions','pages','experience','chamber']) vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),sandbox);
const data=sandbox.SARAH_CONTENT, S=sandbox.Sarah;
test('every photo and historical image resolves to a real local asset',()=>{
 assert.ok(data.media.length>=47);
 for(const collection of [data.media,data.history]){
  assert.equal(new Set(collection.map(x=>x.id)).size,collection.length);
  for(const item of collection){
   assert.ok(item.title);assert.ok(item.id);
   for(const key of ['src','thumb'])if(item[key]){const file=path.join(root,item[key]);assert.ok(fs.existsSync(file),item[key]);assert.ok(fs.statSync(file).size>0,item[key]+' is empty');}
  }
 }
 for(const p of data.media)assert.ok(p.alt && p.publicationState==='published');
});
test('party and shuffle include every published photo once; inputs remain unchanged',()=>{
 const before=JSON.stringify(data.media);
 for(const mode of ['party','shuffle']){
  const list=S.utils.buildPlaylist(data,mode);
  assert.equal(list.length,data.media.length);assert.equal(new Set(list.map(x=>x.id)).size,data.media.length);
 }
 assert.equal(JSON.stringify(data.media),before);
 const undated=S.utils.buildPlaylist(data,'decades','undated');
 assert.ok(undated.length);assert.ok(undated.every(x=>x.decade==='undated'));
 const decade=S.utils.buildPlaylist(data,'decades','2010s');
 assert.ok(decade.every(x=>x.decade==='2010s'));
});
test('calendar preserves Tucson time, midnight rollover, missing end times and UTF-8 folding',()=>{
 const cal=S.utils.calendar(data.events,new Date('2026-09-27T00:00:00Z'));
 assert.ok(cal.includes('DTSTART:20261002T230000Z'));
 assert.ok(cal.includes('DTEND:20261003T030000Z'));
 assert.equal((cal.match(/BEGIN:VEVENT/g)||[]).length,5);
 assert.equal((cal.match(/DTEND:/g)||[]).length,3);
 for(const line of cal.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
 const long=S.utils.calendar([{...data.events[0],subtitle:'É'.repeat(150)+',;\n'}]);
 for(const line of long.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
 assert.ok(long.includes('\\,\\;\\n'));
});
test('untrusted content is escaped and invalid URL encodings fail safely',()=>{
 assert.equal(S.utils.escape('<img onerror="x">&'), '&lt;img onerror=&quot;x&quot;&gt;&amp;');
 assert.equal(S.utils.routeParts('#/%E0%A4%A')[0],'not-found');
});
test('all page types render; shell loads existing local dependencies',()=>{
 const renders=[S.pages.home(),S.pages.journey(),S.pages.love(),S.pages.family(),S.pages.sarah90(),S.pages.memories(),S.events.page(),S.pages.explore('photos'),S.pages.explore('places'),S.pages.explore('history'),S.pages.explore('archive'),S.contributions.page(new URLSearchParams())];
 for(const p of data.people)renders.push(S.pages.family(p.id));
 for(const p of data.chapters)renders.push(S.pages.journey(p.id));
 for(const p of data.events)renders.push(S.events.page(p.id));
 for(const p of data.love)renders.push(S.pages.love(p.id));
 for(const p of data.memories)renders.push(S.pages.memories(p.id));
 for(const mode of ['party','shuffle','decades'])renders.push(S.slideshow.page(mode,'all'));
 for(const html of renders){assert.ok(html.length>100);assert.ok(!html.includes('undefined'));assert.ok(!html.includes('style='));}
 const shell=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const m of shell.matchAll(/(?:src|href)="((?:js|css|assets)\/[^"#]+)"/g))assert.ok(fs.existsSync(path.join(root,m[1].split('?')[0])),m[1]);
});

test('new experience routes render without guessing photograph decades',()=>{
 const before=JSON.stringify(data.media);
 for(const mode of ['all','shuffle']){
  const list=S.chamber.collection(mode);assert.equal(list.length,47);assert.equal(new Set(list.map(x=>x.id)).size,47);
 }
 assert.equal(JSON.stringify(data.media),before);
 assert.equal(S.chamber.collection('2010s').length,2);
 assert.ok(S.chamber.collection('1930s').every(m=>m.type==='history'));
 assert.equal(S.chamber.collection('1970s').length,0);
 assert.equal(S.chamber.collection('invalid'),null);
 const home=S.pages.home();
 assert.ok(home.indexOf('id="weekend"')<home.indexOf('id="meet-sarah"'));
 assert.ok(home.indexOf('id="meet-sarah"')<home.indexOf('id="love-story"'));
 assert.ok(home.indexOf('id="time-capsule"')<home.indexOf('id="photo-journeys"'));
 for(const html of [home,S.experience.biography(),S.experience.day('saturday'),S.chamber.page('all'),S.chamber.page('1970s'),S.pages.love()]){assert.ok(!html.includes('undefined'));assert.ok(!html.includes('style='));}
 assert.ok(S.experience.day('saturday').includes('Sarah’s 90th Birthday Party'));
 const form=S.contributions.page(new URLSearchParams('photo=img_1222'));
 assert.ok(form.includes('img_1222'));assert.ok(form.includes('does not upload or send'));
 assert.equal((form.match(/<option[ >]/g)||[]).length,(form.match(/<\/option>/g)||[]).length);
});
