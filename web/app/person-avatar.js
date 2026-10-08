'use client';
import { assetPath } from '../lib/site-path';
import { useState } from 'react';
export default function PersonAvatar({ person }) {
  const [failed, setFailed] = useState(false);
  return person.image && !failed ? (
    <img
      src={assetPath(person.image)}
      alt={person.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="person-initials" aria-hidden="true">
      {person.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')}
    </span>
  );
}
