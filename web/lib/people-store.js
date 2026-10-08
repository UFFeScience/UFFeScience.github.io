import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
export async function readPeople(){
 try{return JSON.parse(await fs.readFile(path.join(process.cwd(),'data/people.json'),'utf8'));}
 catch{return {daniel:{name:'Daniel de Oliveira',url:'https://danielcmo.github.io/'},students:[],collaborators:[],fetchedAt:null};}
}
