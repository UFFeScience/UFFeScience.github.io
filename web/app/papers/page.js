import SiteHeader from '../site-header';
import Papers from '../papers';
import { readPapers } from '../../lib/papers-store';
export const metadata = { title: 'All papers — UFFeScience' };
export default async function PapersPage() {
  return (
    <>
      <SiteHeader />
      <main className="catalog-page">
        <Papers papers={await readPapers()} listing />
      </main>
    </>
  );
}
