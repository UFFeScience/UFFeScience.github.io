'use client';
import { assetPath } from '../lib/site-path';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import PublicationImage from './publication-image';
export default function LinkedinPosts({ news, listing = false }) {
  const track = useRef(null),
    [limit, setLimit] = useState(24);
  const [query, setQuery] = useState('');
  const posts = news.posts.filter((post) =>
    `${post.title} ${post.text} ${post.author.name}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase().trim()),
  );
  function loadNearEnd(event) {
    const element = event.currentTarget;
    if (
      limit < posts.length &&
      element.scrollWidth - element.scrollLeft - element.clientWidth <= 340
    )
      setLimit(Math.min(limit + 24, posts.length));
  }
  function move(direction) {
    track.current?.scrollBy({
      left: direction * 340,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  return (
    <div className="publication-shelf">
      <div className="publication-shelf-toolbar">
        <p>
          UFFeScience Research Group · updated weekly
          {news.lastCollectedAt &&
            ` · last collected on ${new Date(news.lastCollectedAt).toLocaleDateString('en-US')}`}
        </p>
        {!listing && (
          <div className="shelf-arrows">
            <button onClick={() => move(-1)} aria-label="Previous publications">
              <ArrowLeft size={17} />
            </button>
            <button onClick={() => move(1)} aria-label="Next publications">
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
      {listing && (
        <label className="catalog-search">
          Search publications
          <input
            type="search"
            value={query}
            placeholder="Text or author"
            onChange={(event) => setQuery(event.target.value)}
          />
          <span aria-live="polite">{posts.length} publications</span>
        </label>
      )}
      <div
        className={listing ? 'publication-grid' : 'publication-horizontal-track'}
        ref={track}
        onScroll={loadNearEnd}
        role="region"
        aria-label="Publications"
        tabIndex={0}
      >
        {posts.slice(0, listing ? posts.length : limit).map((post) => (
          <article className="publication-preview" key={post.id}>
            <Link
              className="publication-cover-link"
              href={`/publicacoes/${post.slug}`}
              aria-label={`Read ${post.title}`}
            >
              <PublicationImage
                src={post.cover}
                alt={`Publication cover by ${post.author.name}`}
                className="publication-cover"
              />
            </Link>
            <div className="publication-preview-content">
              <div className="publication-preview-author">
                <img
                  src={assetPath(post.author.avatar || '/uffescience-logo.png')}
                  alt=""
                  width="24"
                  height="24"
                />
                <span>{post.author.name}</span>
              </div>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'America/Sao_Paulo',
                })}
                {post.originalAuthor ? ' · Repost' : ''}
              </time>
              <Link href={`/publicacoes/${post.slug}`}>
                <h3>{post.title}</h3>
              </Link>
              <p>{post.text}</p>
              <Link className="publication-read" href={`/publicacoes/${post.slug}`}>
                Read publication <ArrowUpRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!posts.length && <p className="no-activity">No publications available.</p>}
    </div>
  );
}
