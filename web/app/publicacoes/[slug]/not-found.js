import {homePath} from '../../../lib/site-path';
import Link from 'next/link';
export default function MissingPost(){return <main className="publication-detail"><h1>Publication not found</h1><p>Browse the available publications on the group’s homepage.</p><Link className="publication-back" href={homePath('#novidades')}>Back to publications</Link></main>;}
