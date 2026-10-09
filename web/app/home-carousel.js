'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { assetPath } from '../lib/site-path';
export default function HomeCarousel({ photos }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const multiple = photos.length > 1;
  useEffect(() => {
    if (!multiple || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % photos.length), 6000);
    return () => clearInterval(timer);
  }, [multiple, paused, photos.length]);
  const go = (step) => setIndex((index + step + photos.length) % photos.length);
  return (
    <figure
      className="campus-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="campus-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {photos.map((photo, i) => (
          <img
            key={photo.src}
            src={assetPath(photo.src)}
            alt={photo.alt}
            aria-hidden={i !== index}
          />
        ))}
      </div>
      <figcaption>
        <span>Universidade Federal Fluminense</span>
        <small>Institute of Computing · Niterói, RJ</small>
      </figcaption>
      {multiple && (
        <>
          <button className="campus-prev" onClick={() => go(-1)} aria-label="Previous photo">
            <ChevronLeft size={18} />
          </button>
          <button className="campus-next" onClick={() => go(1)} aria-label="Next photo">
            <ChevronRight size={18} />
          </button>
          <div className="campus-dots">
            {photos.map((photo, i) => (
              <button
                key={photo.src}
                className={i === index ? 'active' : ''}
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </figure>
  );
}
