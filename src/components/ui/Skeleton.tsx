'use client';

import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({ width, height, borderRadius, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className || ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className || ''}`} aria-hidden="true">
      <div className={styles.cardRow}>
        <Skeleton height={16} width="60%" />
        <Skeleton height={12} width={80} />
      </div>
    </div>
  );
}

export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={`${styles.listItem} ${className || ''}`} aria-hidden="true">
      <Skeleton height={14} width="45%" />
      <Skeleton height={12} width={100} />
    </div>
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return (
    <div className={styles.avatarWrapper} aria-hidden="true" style={{ width: size, height: size }}>
      <div className={styles.skeleton} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={`${styles.textBlock} ${className || ''}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? '55%' : '100%'}
        />
      ))}
    </div>
  );
}
