/* Exercise Zone content and media normalization. Stable exercise identities stay unchanged. */
(function(root){
'use strict';
function safeUrl(value){
 try{const u=new URL(String(value||'').trim());if(!['https:','http:'].includes(u.protocol)||!u.hostname||u.username||u.password)return '';if(/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com)$/.test(u.hostname))u.protocol='https:';return u.href;}catch{return '';}
}
function youtubeId(value){
 const safe=safeUrl(value);if(!safe)return '';const u=new URL(safe),host=u.hostname.toLowerCase();let id='';
 if(host==='youtu.be'||host==='www.youtu.be')id=u.pathname.split('/').filter(Boolean)[0]||'';
 else if(/(^|\.)(youtube\.com|youtube-nocookie\.com)$/.test(host))id=u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)(?:\/|$)/)?.[1]||'';
 return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';
}
function mediaInfo(value){
 const url=safeUrl(value);if(!url)return null;const u=new URL(url),host=u.hostname.toLowerCase(),id=youtubeId(url);
 if(id)return {kind:'youtube',id,url:'https://www.youtube.com/watch?v='+id,embed:'https://www.youtube-nocookie.com/embed/'+id};
 if(/(^|\.)vimeo\.com$/.test(host)){const match=u.pathname.match(/(?:^|\/)\b(\d+)\b(?:\/|$)/);if(match){const hash=u.searchParams.get('h')||u.pathname.match(new RegExp('/'+match[1]+'/([A-Za-z0-9]+)(?:/|$)'))?.[1]||'';return {kind:'vimeo',id:match[1],url,embed:'https://player.vimeo.com/video/'+match[1]+(hash?'?h='+encodeURIComponent(hash):'')};}}
 if(u.protocol==='https:'&&/\.(mp4|webm)$/i.test(u.pathname))return {kind:'video',url};return {kind:'link',url};
}
function canonicalMediaUrl(value){const info=mediaInfo(value);return info?.url||'';}
function correction(record){const data=root.LZExerciseQualityData||{},id=record?.id||record?.exerciseId;return data[id]||((record?.provider==='core'||String(id||'').startsWith('exercise:'))?data[root.LZIdentity?.resolve(record)?.id]:null)||null;}
function applyRecord(record){const c=correction(record);if(!c)return record;return {...record,...(c.name?{name:c.name}:{}),aliases:[...new Set([...(record.aliases||[]),...(c.aliases||[])])]};}
function displayName(record){return correction(record)?.name||root.LZIdentity?.displayName(record)||record?.name||'';}
function matches(record,query){if(root.LZIdentity?.matches(record,query))return true;const n=root.LZIdentity?.normalize||((v)=>String(v||'').toLowerCase()),tokens=n(query).split(' ').filter(Boolean),aliases=correction(record)?.aliases||[];return aliases.some(value=>{const words=n(value).split(' ');return tokens.every(token=>words.some(word=>word.startsWith(token)));});}
function guide(record,g,d){const c=correction(record);return {g:c?.guide?{...(g||{}),...c.guide}:g,d:{...d,...(c?.explanation?{explanation:c.explanation}:{}),...Object.fromEntries(['video','source','creator','title'].filter(k=>c&&Object.hasOwn(c,k)).map(k=>[k,c[k]]))}};}
function unavailable(value){const id=youtubeId(value),entries=root.LZExerciseUnavailableVideos||[];return entries.some(row=>typeof row==='string'?(row===id||canonicalMediaUrl(row)===canonicalMediaUrl(value)):row.videoId===id&&Boolean(id));}
function excludedVideo(record,value){const key=canonicalMediaUrl(value);return (correction(record)?.excludeVideos||[]).some(url=>canonicalMediaUrl(url)===key);}
function browseKey(record){if(record?.provider!=='core')return record?.id;return root.LZIdentity?.resolve(record)?.id||record.id;}
root.LZExerciseQuality={safeUrl,youtubeId,mediaInfo,canonicalMediaUrl,correction,applyRecord,displayName,matches,guide,unavailable,excludedVideo,browseKey};
})(typeof window==='undefined'?globalThis:window);
