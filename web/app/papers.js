'use client';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
const PAGE_SIZE = 10;
const kindLabel = { journal: 'Journal', accepted: 'Accepted', conference: 'Conference' };
// First, last and the pages around the current one.
const pageWindow = (page, pages) =>
  [...new Set([0, page - 1, page, page + 1, pages - 1])]
    .filter((i) => i >= 0 && i < pages)
    .sort((a, b) => a - b);
function Authors({ authors }) {
  const names = authors.slice(0, 10).map((author) => author.name);
  return names.join('; ') + (authors.length > 10 ? '; et al.' : '');
}
export default function Papers({ papers }) {
  const section = useRef(null);
  const [year, setYear] = useState('');
  const [page, setPage] = useState(0);
  const years = [...new Set(papers.papers.map((paper) => paper.year))];
  const filtered = year
    ? papers.papers.filter((paper) => paper.year === Number(year))
    : papers.papers;
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  function go(next) {
    setPage(next);
    section.current?.scrollIntoView({ block: 'start' });
  }
  return (
    <section id="artigos" className="papers-section" ref={section}>
      <div className="section-heading">
        <div>
          <div className="kicker">PAPERS / JOURNALS / CONFERENCES</div>
          <h2>Papers</h2>
        </div>
        <select
          className="papers-year"
          value={year}
          onChange={(event) => {
            setYear(event.target.value);
            setPage(0);
          }}
          aria-label="Filter papers by year"
        >
          <option value="">All years</option>
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <p className="section-description">
        Peer-reviewed papers since 2013 · {filtered.length} papers
        {papers.lattesUpdatedAt &&
          ` · from Daniel de Oliveira’s Lattes CV, updated on ${new Date(
            `${papers.lattesUpdatedAt}T12:00:00Z`,
          ).toLocaleDateString('en-US')}`}
      </p>
      <ol className="papers-list">
        {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((paper) => (
          <li key={`${paper.kind}-${paper.year}-${paper.title}`} className="paper-entry">
            <span className="paper-year">{paper.year}</span>
            <div>
              <h3>
                {paper.url ? (
                  <a href={paper.url} target="_blank" rel="noreferrer">
                    {paper.title} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  paper.title
                )}
              </h3>
              <p className="paper-authors">
                <Authors authors={paper.authors} />
              </p>
              <p className="paper-venue">
                <span className="paper-kind">{kindLabel[paper.kind]}</span>
                {paper.venue}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {!filtered.length && <p className="no-activity">No papers available.</p>}
      {pages > 1 && (
        <nav className="papers-pagination" aria-label="Papers pages">
          <button onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous page">
            <ArrowLeft size={15} />
          </button>
          {pageWindow(page, pages).map((i, index, list) => (
            <span key={i} className="papers-page">
              {index > 0 && i - list[index - 1] > 1 && <span aria-hidden="true">…</span>}
              <button
                onClick={() => go(i)}
                className={i === page ? 'active' : ''}
                aria-current={i === page ? 'page' : undefined}
              >
                {i + 1}
              </button>
            </span>
          ))}
          <button onClick={() => go(page + 1)} disabled={page === pages - 1} aria-label="Next page">
            <ArrowRight size={15} />
          </button>
        </nav>
      )}
    </section>
  );
}
