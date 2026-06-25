'use client';

import { useState } from 'react';

export function SkipLink() {
  const [focused, setFocused] = useState(false);

  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        left: focused ? '0' : '-9999px',
        top: 0,
        zIndex: 9999,
        padding: '8px 16px',
        background: 'var(--primary)',
        color: 'var(--on-primary)',
        borderRadius: '0 0 4px 0',
        fontSize: '14px',
        fontWeight: 500,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      Skip to content
    </a>
  );
}
