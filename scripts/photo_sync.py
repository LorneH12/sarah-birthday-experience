#!/usr/bin/env python3
"""Non-destructive photo import audit. Requires Pillow and numpy; never fetches credentials."""
import argparse, hashlib, json, re, sys, tempfile, shutil, os
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np

def read_media(root):
    text=(root/'data/media.js').read_text()
    return json.loads(text.split('window.SARAH_CONTENT.media = ',1)[1].strip().rstrip(';'))

def fingerprint(path):
    with Image.open(path) as raw:
        im=ImageOps.exif_transpose(raw).convert('RGB')
        gray=np.array(im.resize((9,8)).convert('L'))
        bits=(gray[:,1:]>gray[:,:-1]).flatten()
        dh=sum(int(v)<<i for i,v in enumerate(bits))
        tiny=np.array(im.resize((32,32))).astype(np.int16)
        return {'sha256':hashlib.sha256(Path(path).read_bytes()).hexdigest(),'pixels':hashlib.sha256(str(im.size).encode()+im.tobytes()).hexdigest(),'dhash':f'{dh:016x}','width':im.width,'height':im.height},tiny

def compare(a,b,ta,tb):
    if a['sha256']==b['sha256'] or a['pixels']==b['pixels']:return 'exact',0,0
    h=(int(a['dhash'],16)^int(b['dhash'],16)).bit_count()
    distance=float(np.abs(ta-tb).mean())
    ratio=abs(a['width']/a['height']-b['width']/b['height'])
    if h<=10 and distance<=22 and ratio<.08:return 'similar',h,round(distance,2)
    return None,h,round(distance,2)

def audit(root,inputs):
    known=[];report={'existing_pairs':[],'candidates':[],'errors':[]}
    ip=root/'docs/photo-index.json';history=json.loads(ip.read_text()).get('sources',[]) if ip.exists() else []
    for item in read_media(root):
        try:
            fp,t=fingerprint(root/item['src'])
            with Image.open(root/item['thumb']) as thumb: thumb.load()
            for prev,pf,pt in known:
                match,h,d=compare(fp,pf,t,pt)
                if match:report['existing_pairs'].append({'a':prev,'b':item['id'],'match':match,'hash_distance':h,'pixel_distance':d})
            known.append((item['id'],fp,t))
        except Exception as exc:report['errors'].append({'id':item['id'],'error':str(exc)})
    for item in inputs:
        try:
            fp,t=fingerprint(item['path']);matches=[]
            for prev,pf,pt in known:
                match,h,d=compare(fp,pf,t,pt)
                if match:matches.append({'id':prev,'match':match,'hash_distance':h,'pixel_distance':d})
            report['candidates'].append({**item,'fingerprint':fp,'matches':matches,'decision':'processed' if any(h.get('sourceId')==item['id'] and h.get('sha256')==fp['sha256'] for h in history) else 'skip' if any(x['match']=='exact' for x in matches) else 'review' if matches else 'inspect','changedSource':any(h.get('sourceId')==item['id'] and h.get('sha256')!=fp['sha256'] for h in history)})
            known.append(('candidate:'+item['id'],fp,t))
        except Exception as exc:report['errors'].append({'id':item.get('id'),'error':str(exc)})
    return report

def apply_staged(root,approved):
    media=read_media(root);ids={x['id'] for x in media}
    indexpath=root/'docs/photo-index.json'
    index=json.loads(indexpath.read_text()) if indexpath.exists() else {'sources':[]}
    known={(x.get('sourceId'),x.get('sha256')) for x in index['sources']}
    for entry in approved:
        item=dict(entry.get('media',{}));source=entry['source'];fp,_=fingerprint(source['path'])
        key=(source['id'],fp['sha256'])
        if key in known:continue
        record={'sourceId':source['id'],**fp}
        if source.get('modifiedTime'):record['modifiedTime']=source['modifiedTime']
        prior=next((x for x in index['sources'] if x.get('status')!='held' and (x.get('sha256')==fp['sha256'] or x.get('pixels')==fp['pixels'])),None)
        if prior:
            record.update(status='duplicate',publicId=prior['publicId']);index['sources'].append(record);known.add(key);continue
        if entry.get('decision')=='duplicate':
            if entry['duplicateOf'] not in ids:raise ValueError('Unknown duplicate target')
            record.update(status='duplicate',publicId=entry['duplicateOf']);index['sources'].append(record);known.add(key);continue
        if entry.get('decision')=='hold':
            record.update(status='held',reason=entry.get('reason','Needs review'));index['sources'].append(record);known.add(key);continue
        if entry.get('decision')!='publish':raise ValueError('Unreviewed decision')
        pid=item['id']
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*',pid) or pid in ids:raise ValueError('Invalid or existing photo id: '+pid)
        if not item.get('alt') or not item.get('title'):raise ValueError('Reviewed title and alt text required')
        with Image.open(source['path']) as raw:
            im=ImageOps.exif_transpose(raw).convert('RGB')
            full=im.copy();full.thumbnail((1800,1800));thumb=im.copy();thumb.thumbnail((520,520))
            dest=root/'assets/images';dest.mkdir(parents=True,exist_ok=True)
            full.save(dest/(pid+'.webp'),'WEBP',quality=87,method=6)
            thumb.save(dest/(pid+'-thumb.webp'),'WEBP',quality=78,method=6)
        item.update(src='assets/images/'+pid+'.webp',thumb='assets/images/'+pid+'-thumb.webp',publicationState='published')
        item.setdefault('decade','undated');item.setdefault('dateLabel','Date to be confirmed');item.setdefault('tag','Family');item.setdefault('source','Eldridge family collection');item.setdefault('credit','Shared by the family')
        media.append(item);ids.add(pid);known.add(key)
        index['sources'].append({**record,'status':'published','publicId':pid})
    (root/'data/media.js').write_text('/* Public photo manifest. See docs/maintenance.md. */\nwindow.SARAH_CONTENT = window.SARAH_CONTENT || {};\nwindow.SARAH_CONTENT.media = '+json.dumps(media,ensure_ascii=False,indent=2)+';\n')
    indexpath.write_text(json.dumps(index,indent=2)+'\n')
    return {'published_total':len(media),'tracked_sources':len(index['sources'])}

def apply(root,approved):
    # Stage the entire batch first. Roll back applied files if promotion fails.
    with tempfile.TemporaryDirectory(prefix='sarah-photo-stage-') as tmp:
        stage=Path(tmp)/'stage';stage.mkdir()
        for folder in ['data','docs','assets']:
            shutil.copytree(root/folder,stage/folder)
        result=apply_staged(stage,approved)
        changes=[]
        for src in stage.rglob('*'):
            if not src.is_file():continue
            relative=src.relative_to(stage);dest=root/relative
            if dest.exists() and src.read_bytes()==dest.read_bytes():continue
            if src.suffix=='.webp':
                with Image.open(src) as check:check.load()
            changes.append((src,dest,dest.read_bytes() if dest.exists() else None))
        done=[]
        try:
            for src,dest,backup in changes:
                dest.parent.mkdir(parents=True,exist_ok=True)
                temporary=dest.with_name(dest.name+'.sync-tmp')
                shutil.copyfile(src,temporary);os.replace(temporary,dest);done.append((dest,backup))
        except Exception:
            for dest,backup in reversed(done):
                if backup is None:dest.unlink(missing_ok=True)
                else:dest.write_bytes(backup)
            raise
        return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['audit','apply']);p.add_argument('--repo',required=True);p.add_argument('--input',required=True);p.add_argument('--output')
    args=p.parse_args();root=Path(args.repo).resolve();payload=json.loads(Path(args.input).read_text())
    out=audit(root,payload) if args.command=='audit' else apply(root,payload)
    text=json.dumps(out,indent=2)
    if args.output:Path(args.output).write_text(text+'\n')
    else:print(text)
    if out.get('errors'):sys.exit(1)
