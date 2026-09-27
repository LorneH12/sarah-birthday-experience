/* Shared pure helpers: safe text, routes, dates, and slideshow ordering. */
window.Sarah = window.Sarah || {};
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const shuffle = (items, random = Math.random) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const utcStamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const icsEscape = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const foldLine = line => {
    // RFC 5545 lines are limited to 75 octets, including continuation whitespace.
    const lines = []; let part = ''; let bytes = 0;
    for (const char of line) {
      const count = new TextEncoder().encode(char).length;
      if (bytes + count > 75) { lines.push(part); part = ' '; bytes = 1; }
      part += char; bytes += count;
    }
    lines.push(part); return lines.join('\r\n');
  };
  const calendar = (events, now = new Date()) => {
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Eldridge Family//Sarah 90//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    for (const event of events) {
      lines.push('BEGIN:VEVENT',`UID:${event.id}-2026@sarah-eldridge-legacy`,`DTSTAMP:${utcStamp(now)}`,`DTSTART:${utcStamp(event.start)}`);
      if (event.end) lines.push(`DTEND:${utcStamp(event.end)}`);
      lines.push(`SUMMARY:${icsEscape(event.subtitle)}`,`LOCATION:${icsEscape(event.address || event.venue + ' — see your family invitation')}`,`DESCRIPTION:${icsEscape(event.description + '\nAttire: ' + event.attire + '\nAll scheduled times are America/Phoenix. ' + (event.end ? '' : 'End time not supplied by the family.'))}`,'END:VEVENT');
    }
    lines.push('END:VCALENDAR'); return lines.map(foldLine).join('\r\n') + '\r\n';
  };
  const dateLabel = date => new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/Phoenix'}).format(new Date(date + 'T12:00:00-07:00'));
  const routeParts = hash => {
    try { return (hash || '#/home').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); }
    catch { return ['not-found']; }
  };
  const buildPlaylist = (data, mode, decade = 'all') => {
    const photos = data.media.filter(item => item.publicationState === 'published');
    if (mode === 'shuffle') return shuffle(photos);
    if (mode === 'party') return photos;
    const chapters = data.chapters.filter(item => item.decade && (decade === 'all' || item.decade === decade)).map(item => ({...item,type:'chapter',dateLabel:item.year}));
    const history = data.history.filter(item => decade === 'all' || item.decade === decade);
    const datedPhotos = photos.filter(item => item.decade !== 'undated' && (decade === 'all' || item.decade === decade));
    if (decade === 'undated') return photos.filter(item => item.decade === 'undated');
    return [...chapters,...history,...datedPhotos].sort((a,b) => (parseInt(a.date || a.year || a.decade,10) || 0) - (parseInt(b.date || b.year || b.decade,10) || 0));
  };
  Sarah.utils = {escape,shuffle,calendar,utcStamp,dateLabel,routeParts,buildPlaylist};
})();
