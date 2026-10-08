import 'server-only';
import {getGithub} from './data';
export async function getPublicActivity(){const store=await getGithub();return {items:Object.values(store.details || {}).flatMap(detail=>detail.updates || []),source:'stored',fetchedAt:store.fetchedAt};}
