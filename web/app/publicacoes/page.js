import SiteHeader from '../site-header';
import LinkedinPosts from '../linkedin-posts';
import { readPublications } from '../../lib/publication-store';
export const metadata = { title: 'All publications — UFFeScience' };
export default async function PublicationsPage() {
  return (
    <>
      <SiteHeader />
      <main className="catalog-page">
        <div className="section-heading">
          <div>
            <div className="kicker">NEWS / EVENTS / RESULTS</div>
            <h1>Publications</h1>
          </div>
        </div>
        <LinkedinPosts news={await readPublications()} listing />
      </main>
    </>
  );
}
