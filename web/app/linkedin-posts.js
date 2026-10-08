'use client';
import {assetPath,homePath} from '../lib/site-path';
import Link from 'next/link';
import { useRef,useState } from 'react';
import { ArrowLeft,ArrowRight,ArrowUpRight } from 'lucide-react';
import PublicationImage from './publication-image';
export default function LinkedinPosts({news}){
 const track=useRef(null),[limit,setLimit]=useState(24);
 const posts=news.posts;
 function loadNearEnd(event){const element=event.currentTarget;if(limit<posts.length && element.scrollWidth-element.scrollLeft-element.clientWidth<=340)setLimit(Math.min(limit+24,posts.length));}
 function move(direction){track.current?.scrollBy({left:direction*340,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 return <div className="publication-shelf"><div className="publication-shelf-toolbar"><p>{news.source==='apify'?`UFFeScience Research Group and Daniel de Oliveira · updated weekly${news.lastCollectedAt?' · last collected on '+new Date(news.lastCollectedAt).toLocaleDateString('en-US'):''}`:'Publications from the supplied reference. The first collection is being prepared.'}</p><div className="shelf-arrows"><button onClick={()=>move(-1)} aria-label="Previous publications"><ArrowLeft size={17}/></button><button onClick={()=>move(1)} aria-label="Next publications"><ArrowRight size={17}/></button></div></div><div className="publication-horizontal-track" ref={track} onScroll={loadNearEnd} role="region" aria-label="Recent publications, horizontal scrolling" tabIndex={0}>{posts.slice(0,limit).map(post=><article className="publication-preview" key={post.id}><Link className="publication-cover-link" href={`/publicacoes/${post.slug}`} aria-label={`Read ${post.title}`}><PublicationImage src={post.cover} alt={`Publication cover by ${post.author.name}`} className="publication-cover"/></Link><div className="publication-preview-content"><div className="publication-preview-author"><img src={assetPath(post.author.avatar || '/uffescience-logo.png')} alt="" width="24" height="24"/><span>{post.author.name}</span></div><time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Sao_Paulo'})}{post.originalAuthor?' · Repost':''}</time><Link href={`/publicacoes/${post.slug}`}><h3>{post.title}</h3></Link><p>{post.text}</p><Link className="publication-read" href={`/publicacoes/${post.slug}`}>Read publication <ArrowUpRight size={14}/></Link></div></article>)}</div>{!posts.length && <p className="no-activity">No publications available.</p>}</div>;
}
