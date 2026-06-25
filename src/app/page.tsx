import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.wrapper}>
      {/* Hero Section Container */}
      <header className={styles.heroContainer}>
        {/* Hero Background Image */}
        <div className={styles.heroBackground}>
          <Image
            src="/images/origina-auth-illustration.png"
            alt="Collaborative startup planning session"
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} />
        </div>

        {/* Global Navigation Header (Overlayed on Hero) */}
        <div className={styles.header}>
          <div className={styles.logo}>
            Origina
          </div>
          <nav className={styles.navActions} aria-label="Primary Navigation">
            <Link href="/login" className={styles.loginLink}>
              Sign In
            </Link>
            <Link href="/signup" className={styles.signupBtn}>
              Sign Up
            </Link>
          </nav>
        </div>

        {/* Hero Title & Primary CTAs */}
        <div className={styles.heroContent}>
          <span className={styles.tagline}>Product Workspace</span>
          <h1 className={styles.headline}>
            Turn startup ideas<br />
            into structured product plans.
          </h1>
          <p className={styles.description}>
            Origina helps founders transform ideas into roadmaps, personas, MVP scopes, and strategic artifacts through an AI-powered conversational workspace.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/signup" className={styles.primaryCta}>
              Get Started
            </Link>
            <Link href="/login" className={styles.secondaryCta}>
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area Below the Hero */}
      <main className={styles.mainContent} id="main-content">
        
        {/* Section 1: How It Works */}
        <section className={styles.section} aria-labelledby="how-it-works-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Process</span>
            <h2 id="how-it-works-title" className={styles.sectionTitle}>How Origina Works</h2>
          </div>
          
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <h3 className={styles.stepTitle}>Submit Startup Idea</h3>
              <p className={styles.stepText}>
                Describe your startup concept and define the core problem you seek to solve in simple, natural language.
              </p>
            </div>
            
            <div className={styles.stepCard}>
              <h3 className={styles.stepTitle}>Generate Artifacts</h3>
              <p className={styles.stepText}>
                Origina triggers independent AI strategy experts to outline your target personas, define your MVP, and map a phased roadmap.
              </p>
            </div>
            
            <div className={styles.stepCard}>
              <h3 className={styles.stepTitle}>Refine &amp; Export</h3>
              <p className={styles.stepText}>
                Collaborate with an AI assistant to refine specific cards, measure plan viability with a Health Score, and export reports in PDF, DOCX, or PPTX.
              </p>
            </div>
          </div>
        </section>


        {/* Section 3: Final Call to Action */}
        <section className={styles.finalCtaContainer} aria-labelledby="cta-title">
          <h2 id="cta-title" className={styles.finalCtaTitle}>
            Ready to turn your idea into a structured product plan?
          </h2>
          <p className={styles.finalCtaText}>
            Join founders and product strategists building with clarity and focus. No complex onboarding or chat prompts required.
          </p>
          <div className={styles.finalCtaButtons}>
            <Link href="/signup" className={styles.finalPrimaryCta}>
              Get Started
            </Link>
            <Link href="/login" className={styles.finalSecondaryCta}>
              Sign In
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerLogo}>
            Origina
          </div>
          <div>
            &copy; 2026 Origina. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
