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
// Collections are browsing descriptors. Never rewrite an exercise identity or saved record.
const categories=[['all','All exercises'],['weightlifting','Weightlifting'],['gymnastics','Gymnastics'],['weights','External Weights'],['bodyweight','Bodyweight'],['jumps','Jumps and Plyometrics'],['mobility','Mobility and Warm Up'],['conditioning','Conditioning']];
const collectionIds=new Set(categories.map(([id])=>id).filter(id=>id!=='all'));
function memberships(record,classification){
 const e=record||{};
 // Read legacy personal "other" collections through the same rules without changing user data.
 if(collectionIds.has(e.collection))return [e.collection];
 const normalize=root.ExerciseTaxonomy?.name||root.LZIdentity?.normalize||((v)=>String(v||'').toLowerCase());
 const n=normalize(e.name||e.exerciseName||e.title),s=normalize([...(e.sections||[]),e.category,e.sourceCategory,e.subpattern].filter(Boolean).join(' ')),c=classification||root.ExerciseLens?.classify(e)||{},out=[];
 const add=id=>{if(!out.includes(id))out.push(id);};
 const mobilityGuide=root.LZMobilityGuides?.[e.name];
 const mobility=!!mobilityGuide||/mobility|stretch|warm up|flexibility|foam roll|prehab|rehab|opener|floss|pigeon|world.?s greatest|elephant walk|squat to stand/.test(s+' '+n);
 const external=/\b(?:barbell|dumbbell|kettlebell|machine|cable|band|banded|weighted|landmine|trap bar|plate|medicine ball|med ball|sandbag|sled|theraband)\b/.test(n)||/\b(?:bench press|chest press|deadlift|\brdl\b|back squat|front squat|goblet|zercher|hack squat|belt squat|safety bar|smith|anderson squat|pin squat|pendulum squat|box squat|tempo squat|pause squat|cyclist squat|hatfield squat|kang squat|first pull squat|good morning|hip thrust|leg press|pulldown|pull down|face pull|bent over row|chest supported row|meadows row|pendlay row|push press|strict press|arnold press|overhead press|shoulder press|pallof|farmer|suitcase carry|front rack carry|overhead carry|rack pull|block pull|leg curl|knee extension|leg extension|hip abduction|hip adduction|biceps curl|hammer curl|preacher curl|concentration curl|triceps|lateral raise|front raise|rear delt fly|chest fly|windmill|jefferson curl)\b/.test(n)||c.pattern==='carry';
 const body=/\b(?:bodyweight|push up|pull up|chin up|dip|plank|hollow|sit up|inverted row|trx row|air squat|pistol|shrimp squat|skater squat|sissy squat|calf raise|tibialis raise|nordic|harop|razor|ring|handstand|handstannd|hspu|lever|planche|wall walk|dead bug|bird dog|arch|crunch|leg raise|knee raise|leg lift|toes to bar|tuck up|v up|dragon flag|hamstring slider|glute bridge|back extension|hip extension|dead hang|chin hold|german hang|rope climb|superman|flutter kick|knees to elbow)\b/.test(n);
 if(c.pattern==='weightlifting'||/\b(?:weightlifting|snatch|clean|jerk)\b/.test(s+' '+n))add('weightlifting');
 if(c.pattern==='skills'||/\b(?:ring|gymnastic|gymnastics|muscle up|handstand|handstannd|hspu|planche|lever|nordic|harop|razor curl|false grip|l sit|skin the cat|german hang|rope climb|dead hang|chin hold|candlestick|parallette|parallete|iron cross)\b/.test(n))add('gymnastics');
 if(c.pattern==='jump'||/\b(?:jump|plyometric|pogo|bound|hop|landing|deceleration|single under|double under)\b/.test(s+' '+n))add('jumps');
 if(mobility)add('mobility');
 if(c.pattern==='locomotion'||c.pattern==='throw'||/\b(?:conditioning|running|sprint|sled|ergometer|rowing|cycling|burpee|battle rope|crawl|crab walk|medicine ball|med ball|scoop toss)\b/.test(s+' '+n))add('conditioning');
 if(external||/\baccessory\b/.test(s)&&!body)add('weights');
 if(body&&!external)add('bodyweight');
 // An unweighted squat, lunge, step or trunk drill remains a bodyweight option.
 if(!external&&(['squat','hinge','core'].includes(c.pattern)||/\b(?:lunge|split squat|step up|step down|squat|trunk|abs|ab|back extension|cross chop|floor wiper|rolling pin|full moon|halfmoon|half moon)\b/.test(s+' '+n)))add('bodyweight');
 if(!out.length){
  // Provider context keeps non-exercise source videos reachable in their existing collection.
  if(e.kind&&e.kind!=='exercise')add(e.provider==='catalyst'?'weightlifting':e.provider==='monkey'?'gymnastics':'conditioning');
  else if(/\b(?:strength|general exercise|accessory)\b/.test(s)||['horizontal-pull','horizontal-push','vertical-pull','vertical-push'].includes(c.pattern)||c.muscle&&c.muscle!=='core')add('weights');
  else add('bodyweight');
 }
 return out;
}
root.LZExerciseQuality={safeUrl,youtubeId,mediaInfo,canonicalMediaUrl,correction,applyRecord,displayName,matches,guide,unavailable,excludedVideo,browseKey,categories,memberships};
})(typeof window==='undefined'?globalThis:window);
