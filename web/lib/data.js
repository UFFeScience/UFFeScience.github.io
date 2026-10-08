import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import snapshot from './github-snapshot.json';
import {readPublications} from './publication-store';
export async function getGithub(){
 try{return {...JSON.parse(await fs.readFile(path.join(process.cwd(),'data/projects.json'),'utf8')),source:'stored'};}
 catch{return {...snapshot,details:{},source:'snapshot'};}
}
export async function getNews(){return readPublications();}
