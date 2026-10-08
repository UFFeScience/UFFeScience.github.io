import {assetPath,homePath} from '../../../lib/site-path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft,ArrowUpRight } from 'lucide-react';
import { readPublications } from '../../../lib/publication-store';
import SiteHeader from '../../site-header';
import PublicationImage from '../../publication-image';
export const dynamicParams=false;
export async function generateStaticParams(){const {posts}=await readPublications();return posts.flatMap(post=>[post.slug,...(post.aliasSlugs || [])].map(slug=>({slug})));}
export async function generateMetadata({params}){
 const {slug}=await params;
 const {posts}=await readPublications();const post=posts.find(item=>item.slug===slug || item.aliasSlugs?.includes(slug));
 return post?{title:`${post.title} — UFFeScience`,description:post.text.slice(0,160)}:{title:'Publication not found — UFFeScience'};
}
export default async function PublicationPage({params}){
 const {slug}=await params;
 const {posts}=await readPublications();const post=posts.find(item=>item.slug===slug || item.aliasSlugs?.includes(slug));
 if(!post)notFound();
 const index=posts.findIndex(item=>item.id===post.id),next=posts[index+1];
 return <><SiteHeader/><main className="publication-detail"><Link href={homePath('#novidades')} className="publication-back"><ArrowLeft size={15}/> All publications</Link><article><div className="publication-detail-meta"><span>{post.originalAuthor?'Repost':'Publication'}</span><time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric',timeZone:'America/Sao_Paulo'})}</time></div><h1>{post.title}</h1><div className="publication-detail-author"><img src={assetPath(post.author.avatar || '/uffescience-logo.png')} alt="" width="40" height="40"/><div><a href={post.author.url || 'https://www.linkedin.com/company/uffescience-research-group'} target="_blank" rel="noreferrer">{post.author.name} <ArrowUpRight size={12}/></a>{post.originalAuthor && <small>Reposted a publication by {post.originalAuthor.name}</small>}</div></div>{post.cover && <PublicationImage src={post.cover} alt={`Publication image by ${post.author.name}`} className="publication-detail-cover"/>}<div className="publication-full-text">{post.text.split(/\n\s*\n/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div>{post.images?.length>1 && <div className="publication-detail-gallery">{post.images.slice(1).map((image,i)=><PublicationImage key={image} src={image} alt={`Publication image ${i+2}`} className="publication-gallery-image"/>)}</div>}{post.url && <a className="publication-original" href={post.url} target="_blank" rel="noreferrer">View original post on LinkedIn <ArrowUpRight size={16}/></a>}</article><div className="publication-detail-footer"><Link href={homePath('#novidades')}>Back to publications</Link>{next && <Link href={`/publicacoes/${next.slug}`}>Next publication <ArrowUpRight size={14}/></Link>}</div></main></>;
}
