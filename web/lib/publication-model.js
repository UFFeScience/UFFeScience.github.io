import { createHash } from 'node:crypto';
export const publicationSources = [
 {id:'group',name:'UFFeScience Research Group',url:'https://www.linkedin.com/company/uffescience-research-group'},
 {id:'daniel',name:'Daniel de Oliveira',url:'https://www.linkedin.com/in/daniel-de-oliveira-b258368/'},
];
export function slugify(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75).replace(/-$/,'');}
export function publicUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}}
export function mediaUrl(value){const url=publicUrl(value);if(!url)return null;const host=new URL(url).hostname;return /(^|\.)(licdn\.com|linkedin\.com|apifyusercontent\.com)$/.test(host)?url:null;}
export function normalizePublication(raw,source){
 if(raw.type && raw.type!=='post')return null;
 const text=raw.content || raw.text || '';
 const date=raw.postedAt?.date || (raw.postedAt?.timestamp?new Date(raw.postedAt.timestamp).toISOString():null);
 if(!date || !Number.isFinite(new Date(date).getTime()) || !text)return null;
 const id=String(raw.id || createHash('sha256').update(`${raw.linkedinUrl}:${date}`).digest('hex').slice(0,20));
 const title=text.split('\n').map(line=>line.trim()).find(line=>line && !/^🇧🇷\s*(pt-br|português)/i.test(line))?.slice(0,160) || 'Publicação do grupo';
 const shared=raw.repostedBy;
 const author=shared || raw.author || {};
 const rawImages=raw.postImages?.map(image=>typeof image==='string'?image:image.url) || [];
 if(!rawImages.length)rawImages.push(...(raw.document?.coverPages?.[0]?.imageUrls || []));
 const remoteImages=rawImages.map(mediaUrl).filter(Boolean);
 return {
  id,originalPostId:raw.linkedinUrl?.match(/(?:ugcPost|activity)[:-](\d+)/)?.[1] || null,slug:`${slugify(title) || 'publicacao'}-${id.replace(/[^a-zA-Z0-9-]/g,'')}`,title,text,date:new Date(date).toISOString(),
  url:publicUrl(raw.shareLinkedinUrl || raw.linkedinUrl),tag:shared?'Compartilhamento':'Publicação',
  author:{name:author.name || source.name,url:publicUrl(author.linkedinUrl) || source.url,remoteAvatar:mediaUrl(author.avatar?.url)},
  originalAuthor:shared && raw.author?{name:raw.author.name,url:publicUrl(raw.author.linkedinUrl)}:null,
  sourceIds:[source.id],remoteImages,images:[],cover:null,
  engagement:{likes:Number(raw.engagement?.likes)||0,comments:Number(raw.engagement?.comments)||0,shares:Number(raw.engagement?.shares)||0},
 };
}
export function mergePublications(existing,incoming){
 const map=new Map(existing.map(post=>[post.id,post]));
 for(const post of incoming){const previous=map.get(post.id);map.set(post.id,{...previous,...post,author:{...post.author,avatar:post.author.avatar || previous?.author?.avatar},slug:previous?.slug || post.slug,sourceIds:[...new Set([...(previous?.sourceIds || []),...post.sourceIds])],cover:post.cover || previous?.cover || null,images:post.images?.length?post.images:previous?.images || []});}
 return deduplicatePublications([...map.values()]);
}

// Compare full content and original author; titles alone can repeat across distinct posts.
export function deduplicatePublications(posts){
 const groups=new Map();
 for(const post of [...posts].sort((a,b)=>new Date(a.date)-new Date(b.date))){
  const text=(post.text || '').normalize('NFKC').replace(/\s+/g,' ').trim();
  const author=post.originalAuthor || post.author;
  const authorKey=(author?.name || '').normalize('NFKC').toLocaleLowerCase('pt-BR').trim();
  const originalId=post.originalPostId || post.url?.match(/(?:ugcPost|activity)[:-](\d+)/)?.[1];
  const key=originalId?`linkedin:${originalId}`:text?`${authorKey}:${text}`:`id:${post.id}`;
  const first=groups.get(key);
  if(!first){groups.set(key,{...post});continue;}
  first.sourceIds=[...new Set([...(first.sourceIds || []),...(post.sourceIds || [])])];
  first.aliasSlugs=[...new Set([...(first.aliasSlugs || []),...(post.aliasSlugs || []),post.slug])].filter(slug=>slug!==first.slug);
  if(!first.cover && post.cover){first.cover=post.cover;first.images=post.images;}
 }
 return [...groups.values()].sort((a,b)=>new Date(b.date)-new Date(a.date));
}
