'use client';
import { assetPath } from '../lib/site-path';
import { useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function PublicationImage({ src, alt, className = '', zoomable = false }) {
  const [failed, setFailed] = useState(false);
  const dialog = useRef(null);
  if (!src || failed) {
    return (
      <div className={`publication-cover-placeholder ${className}`}>
        <img src={assetPath('/uffescience-logo.png')} alt="UFF eScience" />
        <span>Research and knowledge</span>
      </div>
    );
  }
  const image = (
    <img
      src={assetPath(src)}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
  if (!zoomable) return image;
  return (
    <>
      <button
        className="publication-image-open"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Enlarge image: ${alt}`}
      >
        {image}
      </button>
      <dialog
        ref={dialog}
        className="publication-image-dialog"
        aria-label={alt}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current.close();
        }}
      >
        <button
          type="button"
          autoFocus
          className="publication-image-close"
          onClick={() => dialog.current.close()}
          aria-label="Close enlarged image"
        >
          <X size={24} />
        </button>
        <img src={assetPath(src)} alt={alt} />
        <a href={assetPath(src)} target="_blank" rel="noreferrer">
          Open original image
        </a>
      </dialog>
    </>
  );
}
