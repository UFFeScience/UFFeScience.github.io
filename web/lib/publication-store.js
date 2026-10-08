import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { referenceNews } from './news';
import { slugify,deduplicatePublications } from './publication-model';
export async function readPublications(){
 try{const store=JSON.parse(await fs.readFile(path.join(process.cwd(),'data','publications.json'),'utf8'));return {...store,posts:deduplicatePublications(store.posts),source:'apify'};}
 catch{return {source:'reference',sources:[],posts:referenceNews.map(post=>({...post,slug:`${slugify(post.title)}-${post.id}`,author:{name:'UFFeScience Research Group',avatar:'/uffescience-logo.png'},images:[],cover:null})),lastCollectedAt:null};}
}
