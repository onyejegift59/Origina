'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import styles from './ArtifactChips.module.css';

export interface ChipDef {
  id: string;
  label: string;
  prompt: string;
}

const ALL_CHIPS: ChipDef[] = [
  { id: 'startup_analysis', label: 'Startup Analysis', prompt: 'Produce a startup analysis covering problem statement, target audience, value proposition, market opportunity, risks, and recommendations.' },
  { id: 'personas', label: 'User Personas', prompt: 'Define user personas with name, role, goals, pain points, and motivations for each segment.' },
  { id: 'mvp_scope', label: 'MVP Scope', prompt: 'Define the MVP scope. Classify features as must-have, should-have, could-have, and excluded.' },
  { id: 'roadmap', label: 'Product Roadmap', prompt: 'Generate a three-phase product roadmap: Core MVP, Validation, and Growth phases with key initiatives.' },
  { id: 'health_score', label: 'Health Score', prompt: 'Evaluate product readiness. Provide a score out of 100 with strengths, risks, and recommendations.' },
  { id: 'positioning_statement', label: 'Positioning Statement', prompt: 'Write a positioning statement covering target market, category, differentiator, and reason to believe.' },
  { id: 'brand_strategy', label: 'Brand Strategy', prompt: 'Define brand strategy covering personality, voice, visual direction, and messaging pillars.' },
  { id: 'value_proposition', label: 'Value Proposition', prompt: 'Define the value proposition with primary benefit, key differentiators, and competitive rationale.' },
  { id: 'user_journey', label: 'User Journey', prompt: 'Map the user journey from discovery to advocacy. Identify touchpoints, friction points, and opportunities at each stage.' },
  { id: 'feature_prioritization', label: 'Feature Prioritization', prompt: 'Prioritize features using RICE or MoSCoW. Rank by impact, effort, and strategic value.' },
  { id: 'competitive_analysis', label: 'Competitive Analysis', prompt: 'Conduct a competitive analysis. Identify key competitors, their strengths and weaknesses, and differentiation opportunities.' },
  { id: 'gtm_plan', label: 'Go-To-Market Plan', prompt: 'Create a go-to-market plan covering launch strategy, target channels, messaging, and first-90-day metrics.' },
  { id: 'landing_page_copy', label: 'Landing Page Copy', prompt: 'Write landing page copy: headline, subheadline, key benefits, and call to action.' },
  { id: 'design_direction', label: 'Design Direction', prompt: 'Recommend a design direction covering layout principles, typography, color palette, and interaction patterns.' },
  { id: 'content_strategy', label: 'Content Strategy', prompt: 'Develop a content strategy with content types, tone, distribution channels, and a publishing cadence.' },
];

const VISIBLE_COUNT = 7;

interface ArtifactChipsProps {
  onGenerate: (chip: ChipDef) => void;
  disabled?: boolean;
  existingArtifacts?: Set<string>;
}

export const ArtifactChips = React.memo(function ArtifactChips({ onGenerate, disabled, existingArtifacts }: ArtifactChipsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleChips = ALL_CHIPS.slice(0, VISIBLE_COUNT);
  const hiddenChips = ALL_CHIPS.slice(VISIBLE_COUNT);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChipClick = (chip: ChipDef) => {
    if (disabled) return;
    setSelectedChipId(chip.id);
    setMoreOpen(false);
    onGenerate(chip);
    setTimeout(() => setSelectedChipId(null), 2000);
  };

  const renderChip = (chip: ChipDef) => {
    const exists = existingArtifacts?.has(chip.id);
    return (
      <button
        key={chip.id}
        className={`${styles.chip}${exists ? ` ${styles.chipDone}` : ''}${selectedChipId === chip.id ? ` ${styles.chipSelected}` : ''}${disabled ? ` ${styles.chipDisabled}` : ''}`}
        onClick={() => handleChipClick(chip)}
        role="listitem"
        aria-label={`${chip.label}${exists ? ' (generated)' : ''}`}
        disabled={disabled}
      >
        {exists && <Check size={14} className={styles.chipCheck} aria-hidden="true" />}
        {chip.label}
      </button>
    );
  };

  return (
    <div className={styles.chipsWrapper}>
      <div className={styles.chipsContainer} role="list" aria-label="Suggested artifacts">
        {visibleChips.map(renderChip)}
        {hiddenChips.length > 0 && (
          <div className={styles.moreWrapper} ref={moreRef}>
            <button
              className={styles.moreChip}
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              aria-label="More artifacts"
              disabled={disabled}
            >
              More
            </button>
            {moreOpen && (
              <div className={styles.moreDropdown} ref={dropdownRef} role="listbox" aria-label="More artifact types">
                {hiddenChips.map((chip) => (
                  <button
                    key={chip.id}
                    className={`${styles.dropdownChip}${existingArtifacts?.has(chip.id) ? ` ${styles.dropdownChipDone}` : ''}`}
                    onClick={() => handleChipClick(chip)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setMoreOpen(false);
                    }}
                    role="option"
                    aria-selected={selectedChipId === chip.id}
                  >
                    {existingArtifacts?.has(chip.id) && <Check size={14} className={styles.chipCheck} aria-hidden="true" />}
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
