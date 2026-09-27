/* Email intake adapter. File previews remain local; no false upload success. */
(() => {
  'use strict';
  const e=Sarah.utils.escape;
  const page = params => {
    const requestedEvent=params.get('event')||'';
    const photo=SARAH_CONTENT.media.find(item=>item.id===params.get('photo'));
    return `<div class="wrap page-bottom"><a class="back-link" href="#/memories">← Family memories</a>${Sarah.ui.heading('Send some birthday love','A birthday wish.<br>A story <em>for Sarah.</em>','Wish Sarah a happy 90th birthday, share a favorite story, or send photos from the birthday weekend. Let’s fill her celebration with love and laughter.')}<div class="share-layout"><form class="share-form" id="contribution-form"><div class="form-grid"><div class="field"><label for="contributor">Your name *</label><input id="contributor" name="contributor" autocomplete="name" maxlength="100" required></div><div class="field"><label for="relationship">Your connection</label><input id="relationship" name="relationship" maxlength="120" placeholder="Family, friend, church family…"></div><div class="field"><label for="contribution-kind">What are you sharing?</label><select id="contribution-kind" name="kind"><option>A birthday wish for Sarah</option><option>A memory or story</option><option>Family photographs</option><option>Event photographs</option><option>Event information or a question</option><option>A correction or identification</option></select></div><div class="field"><label for="event-choice">Related event</label><select id="event-choice" name="event"><option value="">General family collection</option>${SARAH_CONTENT.events.map(item=>`<option value="${e(item.id)}" ${item.id===requestedEvent?'selected':''}>${e(item.day+' — '+item.subtitle)}</option>`).join('')}</select></div></div><div class="field"><label for="memory-text">Tell us about it *</label><textarea id="memory-text" name="memory" maxlength="1800" required placeholder="Who is in the photo? What do you remember? An approximate date is helpful, too.">${photo?e('About the photo “'+photo.title+'” ('+photo.id+'):\n'):params.get('decade')?e('A memory from '+params.get('decade')+':\n'):''}</textarea><small class="muted">Up to 1,800 characters. For a longer story, write directly to the family email.</small></div><div class="drop-zone"><strong>Prepare your photographs</strong><p>Optional local preview · JPEG, PNG, WebP, or HEIC · up to 10 files</p><input id="photo-files" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple aria-label="Choose photographs for local preview"><div id="file-errors" class="error" role="status"></div><div id="upload-previews" class="upload-previews"></div></div><label class="checkbox-row"><input type="checkbox" name="permission" id="publish-permission"><span>The family may display my story and photographs on this celebration website after review. I have permission to share them.</span></label><div class="notice">This opens an email draft. Add the photos as attachments in your email app, then send. Selecting photos here does not upload or send them.</div><div class="button-row"><button type="submit" class="button">Open email draft ${Sarah.ui.icon('arrow')}</button><button type="button" class="button outline" id="copy-memory">Copy message</button></div><p id="contribution-status" class="utility-4 copy-note" role="status"></p></form><aside class="share-aside"><p class="eyebrow">A little help goes a long way</p><h3>Make it easy to remember.</h3><ol><li>Tell us who is pictured. It’s fine if you only know a few names.</li><li>Add a date or decade if you know it. “Not sure” is welcome, too.</li><li>Include the story behind the moment.</li><li>Send original photos when possible. Keep a copy for yourself.</li></ol><div class="divider"></div><p class="copy-note">You can also email the family directly:</p><p><a href="mailto:${e(SARAH_CONTENT.site.email)}">${e(SARAH_CONTENT.site.email)}</a></p><p class="utility-4 copy-note">Photos and stories are reviewed before appearing here. Please don’t send private addresses, health information, or anything you don’t want shared.</p></aside></div></div>`;
  };
  const bind = () => {
    const form=document.getElementById('contribution-form');if(!form)return()=>{};
    let files=[],urls=[];
    const revoke=()=>{urls.forEach(url=>URL.revokeObjectURL(url));urls=[];};
    const status=document.getElementById('contribution-status');
    document.getElementById('photo-files').addEventListener('change',event=>{
      revoke();const errors=[];files=[];
      for(const file of [...event.target.files].slice(0,10)){
        if(file.size>15*1024*1024){errors.push(file.name+': larger than 15 MB.');continue;}
        if(!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)){errors.push(file.name+': unsupported format.');continue;}
        files.push(file);
      }
      if(event.target.files.length>10)errors.push('Only the first 10 selected files are included.');
      document.getElementById('file-errors').textContent=errors.join(' ');
      const preview=document.getElementById('upload-previews');preview.replaceChildren();
      files.forEach(file=>{
        const figure=document.createElement('figure');
        if(!/\.(heic|heif)$/i.test(file.name)){
          const image=document.createElement('img'),url=URL.createObjectURL(file);urls.push(url);image.src=url;image.alt='Local preview of '+file.name;figure.append(image);
        }
        const caption=document.createElement('figcaption');caption.textContent=file.name+(/\.(heic|heif)$/i.test(file.name)?' (attach original; preview unavailable)':'');figure.append(caption);preview.append(figure);
      });
      status.textContent=files.length?`${files.length} photo${files.length===1?'':'s'} selected locally. Remember to attach them to your email.`:'';
    });
    const message = () => {
      const data=new FormData(form);const event=SARAH_CONTENT.events.find(item=>item.id===data.get('event'));
      return `Name: ${data.get('contributor')}\nConnection: ${data.get('relationship')||'Not specified'}\nSharing: ${data.get('kind')}\nEvent: ${event?event.subtitle:'General family collection'}\n\n${data.get('memory')}\n\nPublic display permission: ${data.get('permission')?'Yes, after family review.':'Not granted; please contact me before publishing.'}\n\nPhoto attachments to add: ${files.length?files.map(file=>file.name).join(', '):'None selected on the website.'}`;
    };
    form.addEventListener('submit',event=>{
      event.preventDefault();if(!form.reportValidity())return;
      const subject='Sarah at 90 — '+new FormData(form).get('kind');
      const a=document.createElement('a');a.href='mailto:'+SARAH_CONTENT.site.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message());a.click();
      status.textContent='Email draft requested. Attach your photos and press Send in your email app. Nothing has been sent by this website. If no draft opens, use Copy message and email the family directly.';
    });
    document.getElementById('copy-memory').addEventListener('click',async()=>{
      if(!form.reportValidity())return;
      const text=message();
      if(await Sarah.ui.copy(text))status.textContent='Message copied. Paste it into an email to '+SARAH_CONTENT.site.email+' and attach your photos.';
      else{Sarah.ui.download(text,'sarah-memory.txt');status.textContent='Your message was downloaded as a text file. Email it and your photos to the family.';}
    });
    return revoke;
  };
  Sarah.contributions={page,bind};
})();
