import Link from 'next/link';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Page not found</h1>
        <p className={styles.heroDescription}>
          The page you are looking for does not exist.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/" className={styles.primaryCta}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
