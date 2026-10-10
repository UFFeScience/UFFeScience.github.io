import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import SiteHeader from '../../site-header';
import { readPapers } from '../../../lib/papers-store';
export const dynamicParams = false;
export async function generateStaticParams() {
  const { papers } = await readPapers();
  return papers.map(({ slug }) => ({ slug }));
}
async function findPaper(params) {
  const { slug } = await params;
  const { papers } = await readPapers();
  return papers.find((paper) => paper.slug === slug);
}
export async function generateMetadata({ params }) {
  const paper = await findPaper(params);
  return { title: paper ? `${paper.title} — UFFeScience` : 'Paper not found — UFFeScience' };
}
export default async function PaperPage({ params }) {
  const paper = await findPaper(params);
  if (!paper) notFound();
  return (
    <>
      <SiteHeader />
      <main className="publication-detail">
        <Link href="/papers/" className="publication-back">
          <ArrowLeft size={15} /> All papers
        </Link>
        <article>
          <div className="publication-detail-meta">
            <span>
              {paper.kind === 'journal'
                ? 'Journal article'
                : paper.kind === 'accepted'
                  ? 'Accepted paper'
                  : 'Conference paper'}
            </span>
            <span>{paper.year}</span>
          </div>
          <h1>{paper.title}</h1>
          <div className="publication-full-text">
            <h2>Authors</h2>
            <p>{paper.authors.map((author) => author.name).join('; ')}</p>
            <h2>Published in</h2>
            <p>{paper.venue}</p>
            {paper.abstract && (
              <>
                <h2>Abstract</h2>
                <p>{paper.abstract}</p>
              </>
            )}
            {paper.text && (
              <>
                <h2>Content</h2>
                <p>{paper.text}</p>
              </>
            )}
          </div>
          {paper.url ? (
            <a className="publication-original" href={paper.url} target="_blank" rel="noreferrer">
              Read original paper <ArrowUpRight size={16} />
            </a>
          ) : (
            <p className="section-description">
              An original paper link is not available in the stored record.
            </p>
          )}
        </article>
      </main>
    </>
  );
}
