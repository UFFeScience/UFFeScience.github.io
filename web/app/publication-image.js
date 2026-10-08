'use client';
import { assetPath } from '../lib/site-path';
import { useState } from 'react';
export default function PublicationImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={assetPath(src)}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`publication-cover-placeholder ${className}`}>
      <img src={assetPath('/uffescience-logo.png')} alt="UFF eScience" />
      <span>Research and knowledge</span>
    </div>
  );
}
