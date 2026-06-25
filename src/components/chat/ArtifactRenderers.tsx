import type {
  StartupAnalysis,
  PersonasOutput,
  MvpScope,
  Roadmap,
  HealthScore,
  PositioningStatement,
  BrandStrategy,
  ValueProposition,
  UserJourney,
  FeaturePrioritization,
  CompetitiveAnalysis,
  GoToMarketPlan,
  LandingPageCopy,
  DesignDirection,
  ContentStrategy,
  ArtifactType,
} from '@/types';
import styles from './ArtifactCard.module.css';

interface ArtifactRenderer {
  type: ArtifactType;
  label: string;
  render: (content: Record<string, unknown>) => React.ReactNode;
  renderPreview: (content: Record<string, unknown>) => React.ReactNode;
  getPreviewLines: (content: Record<string, unknown>) => string[];
}

function renderStartupAnalysis(content: Record<string, unknown>) {
  const a = content as unknown as StartupAnalysis;
  return (
    <>
      {a.problemStatement && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Problem Statement</h3>
          <p className={styles.sectionText}>{a.problemStatement}</p>
        </div>
      )}
      {a.targetAudience && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Target Audience</h3>
          <p className={styles.sectionText}>{a.targetAudience}</p>
        </div>
      )}
      {a.valueProposition && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Value Proposition</h3>
          <p className={styles.sectionText}>{a.valueProposition}</p>
        </div>
      )}
      {a.marketOpportunity && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Market Opportunity</h3>
          <p className={styles.sectionText}>{a.marketOpportunity}</p>
        </div>
      )}
      {a.risks?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Risks</h3>
          <ul className={styles.sectionList}>
            {a.risks.map((r, i) => <li key={i} className={styles.sectionListItem}>{r}</li>)}
          </ul>
        </div>
      )}
      {a.recommendations?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recommendations</h3>
          <ul className={styles.sectionList}>
            {a.recommendations.map((r, i) => <li key={i} className={styles.sectionListItem}>{r}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function renderStartupAnalysisPreview(content: Record<string, unknown>) {
  const a = content as unknown as StartupAnalysis;
  return (
    <>
      <span className={styles.previewTitle}>Startup Analysis</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Problem Statement</span>
        <span className={styles.previewText}>{a.problemStatement}</span>
      </div>
      {a.targetAudience && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Target Audience</span>
          <span className={styles.previewText}>{a.targetAudience}</span>
        </div>
      )}
      {a.valueProposition && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Value Proposition</span>
          <span className={styles.previewText}>{a.valueProposition}</span>
        </div>
      )}
    </>
  );
}

function getStartupAnalysisPreviewLines(content: Record<string, unknown>) {
  const a = content as unknown as StartupAnalysis;
  const lines: string[] = [];
  if (a.problemStatement) lines.push(a.problemStatement);
  if (a.targetAudience) lines.push(a.targetAudience);
  if (a.valueProposition) lines.push(a.valueProposition);
  if (a.marketOpportunity) lines.push(a.marketOpportunity);
  return lines;
}

function renderPersonas(content: Record<string, unknown>) {
  const p = content as unknown as PersonasOutput;
  return (
    <>
      {p.personas?.map((persona, i) => (
        <div key={i} className={styles.personaCard}>
          <span className={styles.personaName}>{persona.name}</span>
          <span className={styles.personaRole}>{persona.role}</span>
          {persona.goals?.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Goals</h3>
              <ul className={styles.sectionList}>
                {persona.goals.map((g, j) => <li key={j} className={styles.sectionListItem}>{g}</li>)}
              </ul>
            </div>
          )}
          {persona.painPoints?.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Pain Points</h3>
              <ul className={styles.sectionList}>
                {persona.painPoints.map((pp, j) => <li key={j} className={styles.sectionListItem}>{pp}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function renderPersonasPreview(content: Record<string, unknown>) {
  const p = content as unknown as PersonasOutput;
  return (
    <>
      <span className={styles.previewTitle}>User Personas</span>
      {p.personas?.slice(0, 2).map((persona, i) => (
        <div key={i} className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>{persona.name}</span>
          <span className={styles.previewText}>{persona.role}</span>
          {persona.goals && persona.goals.length > 0 && (
            <ul className={styles.previewList}>
              {persona.goals.slice(0, 2).map((g, j) => (
                <li key={j} className={styles.previewListItem}>{g}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {(p.personas?.length ?? 0) > 2 && (
        <span className={styles.previewText}>+{p.personas.length - 2} more personas</span>
      )}
    </>
  );
}

function getPersonasPreviewLines(content: Record<string, unknown>) {
  const p = content as unknown as PersonasOutput;
  const lines: string[] = [];
  if (p.personas) {
    p.personas.forEach((persona) => {
      lines.push(`${persona.name} — ${persona.role}`);
    });
  }
  return lines;
}

function renderMvpScope(content: Record<string, unknown>) {
  const m = content as unknown as MvpScope;
  return (
    <>
      {m.mustHave?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Must Have</h3>
          <ul className={styles.sectionList}>
            {m.mustHave.map((f, i) => <li key={i} className={styles.sectionListItem}>{f}</li>)}
          </ul>
        </div>
      )}
      {m.shouldHave?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Should Have</h3>
          <ul className={styles.sectionList}>
            {m.shouldHave.map((f, i) => <li key={i} className={styles.sectionListItem}>{f}</li>)}
          </ul>
        </div>
      )}
      {m.couldHave?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Could Have</h3>
          <ul className={styles.sectionList}>
            {m.couldHave.map((f, i) => <li key={i} className={styles.sectionListItem}>{f}</li>)}
          </ul>
        </div>
      )}
      {m.excludedFeatures?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Won't Have (v1)</h3>
          <ul className={styles.sectionList}>
            {m.excludedFeatures.map((f, i) => <li key={i} className={styles.sectionListItem}>{f}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function renderMvpScopePreview(content: Record<string, unknown>) {
  const m = content as unknown as MvpScope;
  return (
    <>
      <span className={styles.previewTitle}>MVP Scope</span>
      {m.mustHave && m.mustHave.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Must Have ({m.mustHave.length})</span>
          <ul className={styles.previewList}>
            {m.mustHave.slice(0, 3).map((f, i) => (
              <li key={i} className={styles.previewListItem}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {m.shouldHave && m.shouldHave.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Should Have ({m.shouldHave.length})</span>
          <ul className={styles.previewList}>
            {m.shouldHave.slice(0, 2).map((f, i) => (
              <li key={i} className={styles.previewListItem}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function getMvpScopePreviewLines(content: Record<string, unknown>) {
  const m = content as unknown as MvpScope;
  const lines: string[] = [];
  if (m.mustHave?.length > 0) {
    lines.push(`Must Have: ${m.mustHave[0]}`);
    if (m.mustHave.length > 1) lines.push(`Must Have: ${m.mustHave[1]}`);
  }
  if (m.shouldHave?.length > 0) {
    lines.push(`Should Have: ${m.shouldHave[0]}`);
  }
  return lines;
}

function renderRoadmap(content: Record<string, unknown>) {
  const r = content as unknown as Roadmap;
  return (
    <>
      {r.phase1?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Phase 1: Core MVP</h3>
          <ul className={styles.sectionList}>
            {r.phase1.map((i, idx) => <li key={idx} className={styles.sectionListItem}>{i}</li>)}
          </ul>
        </div>
      )}
      {r.phase2?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Phase 2: Validation</h3>
          <ul className={styles.sectionList}>
            {r.phase2.map((i, idx) => <li key={idx} className={styles.sectionListItem}>{i}</li>)}
          </ul>
        </div>
      )}
      {r.phase3?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Phase 3: Growth</h3>
          <ul className={styles.sectionList}>
            {r.phase3.map((i, idx) => <li key={idx} className={styles.sectionListItem}>{i}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function renderRoadmapPreview(content: Record<string, unknown>) {
  const r = content as unknown as Roadmap;
  return (
    <>
      <span className={styles.previewTitle}>Product Roadmap</span>
      {r.phase1 && r.phase1.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Phase 1: Core MVP</span>
          <ul className={styles.previewList}>
            {r.phase1.slice(0, 2).map((item, i) => (
              <li key={i} className={styles.previewListItem}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {r.phase2 && r.phase2.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Phase 2: Validation</span>
          <ul className={styles.previewList}>
            {r.phase2.slice(0, 1).map((item, i) => (
              <li key={i} className={styles.previewListItem}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function getRoadmapPreviewLines(content: Record<string, unknown>) {
  const r = content as unknown as Roadmap;
  const lines: string[] = [];
  if (r.phase1?.length > 0) lines.push(`Phase 1: ${r.phase1.length} items`);
  if (r.phase2?.length > 0) lines.push(`Phase 2: ${r.phase2.length} items`);
  if (r.phase3?.length > 0) lines.push(`Phase 3: ${r.phase3.length} items`);
  return lines;
}

function renderHealthScore(content: Record<string, unknown>) {
  const h = content as unknown as HealthScore;
  return (
    <>
      <div className={styles.scoreCard}>
        <div
          className={`${styles.scoreCircle} ${h.score >= 70 ? styles.scoreHigh : h.score >= 40 ? styles.scoreMid : styles.scoreLow}`}
          aria-label={`Health score: ${h.score} out of 100`}
        >
          {h.score}
        </div>
        <div className={styles.scoreInfo}>
          <span className={styles.scoreLabel}>
            {h.score >= 70 ? 'Strong' : h.score >= 40 ? 'Needs Work' : 'At Risk'}
          </span>
          <span className={styles.scoreDesc}>Overall readiness score</span>
        </div>
      </div>
      {h.strengths?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Strengths</h3>
          <ul className={styles.sectionList}>
            {h.strengths.map((s, i) => <li key={i} className={styles.sectionListItem}>{s}</li>)}
          </ul>
        </div>
      )}
      {h.risks?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Risks</h3>
          <ul className={styles.sectionList}>
            {h.risks.map((r, i) => <li key={i} className={styles.sectionListItem}>{r}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function renderHealthScorePreview(content: Record<string, unknown>) {
  const h = content as unknown as HealthScore;
  const status = h.score >= 70 ? 'Strong' : h.score >= 40 ? 'Needs Work' : 'At Risk';
  return (
    <>
      <span className={styles.previewTitle}>Health Score: {h.score}/100 — {status}</span>
      {h.strengths && h.strengths.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Strengths</span>
          <ul className={styles.previewList}>
            {h.strengths.slice(0, 2).map((s, i) => (
              <li key={i} className={styles.previewListItem}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {h.risks && h.risks.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Risks</span>
          <ul className={styles.previewList}>
            {h.risks.slice(0, 1).map((r, i) => (
              <li key={i} className={styles.previewListItem}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function getHealthScorePreviewLines(content: Record<string, unknown>) {
  const h = content as unknown as HealthScore;
  const lines: string[] = [];
  lines.push(`Score: ${h.score}/100 — ${h.score >= 70 ? 'Strong' : h.score >= 40 ? 'Needs Work' : 'At Risk'}`);
  if (h.strengths?.length > 0) lines.push(`Strengths: ${h.strengths[0]}`);
  if (h.risks?.length > 0) lines.push(`Risks: ${h.risks[0]}`);
  return lines;
}

function renderPositioningStatement(content: Record<string, unknown>) {
  const p = content as unknown as PositioningStatement;
  return (
    <>
      {p.targetMarket && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Target Market</h3>
          <p className={styles.sectionText}>{p.targetMarket}</p>
        </div>
      )}
      {p.category && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Category</h3>
          <p className={styles.sectionText}>{p.category}</p>
        </div>
      )}
      {p.uniqueDifferentiator && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Unique Differentiator</h3>
          <p className={styles.sectionText}>{p.uniqueDifferentiator}</p>
        </div>
      )}
      {p.reasonToBelieve && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Reason to Believe</h3>
          <p className={styles.sectionText}>{p.reasonToBelieve}</p>
        </div>
      )}
    </>
  );
}

function renderPositioningStatementPreview(content: Record<string, unknown>) {
  const p = content as unknown as PositioningStatement;
  return (
    <>
      <span className={styles.previewTitle}>Positioning Statement</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Target Market</span>
        <span className={styles.previewText}>{p.targetMarket}</span>
      </div>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Category</span>
        <span className={styles.previewText}>{p.category}</span>
      </div>
      {p.uniqueDifferentiator && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Differentiator</span>
          <span className={styles.previewText}>{p.uniqueDifferentiator}</span>
        </div>
      )}
    </>
  );
}

function getPositioningStatementPreviewLines(content: Record<string, unknown>) {
  const p = content as unknown as PositioningStatement;
  const lines: string[] = [];
  if (p.targetMarket) lines.push(p.targetMarket);
  if (p.uniqueDifferentiator) lines.push(p.uniqueDifferentiator);
  return lines;
}

function renderBrandStrategy(content: Record<string, unknown>) {
  const b = content as unknown as BrandStrategy;
  return (
    <>
      {b.brandPersonality && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Brand Personality</h3>
          <p className={styles.sectionText}>{b.brandPersonality}</p>
        </div>
      )}
      {b.brandVoice && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Brand Voice</h3>
          <p className={styles.sectionText}>{b.brandVoice}</p>
        </div>
      )}
      {b.visualDirection && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Visual Direction</h3>
          <p className={styles.sectionText}>{b.visualDirection}</p>
        </div>
      )}
      {b.messagingPillars?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Messaging Pillars</h3>
          <ul className={styles.sectionList}>
            {b.messagingPillars.map((m, i) => <li key={i} className={styles.sectionListItem}>{m}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function renderBrandStrategyPreview(content: Record<string, unknown>) {
  const b = content as unknown as BrandStrategy;
  return (
    <>
      <span className={styles.previewTitle}>Brand Strategy</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Personality</span>
        <span className={styles.previewText}>{b.brandPersonality}</span>
      </div>
      {b.brandVoice && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Voice</span>
          <span className={styles.previewText}>{b.brandVoice}</span>
        </div>
      )}
      {b.messagingPillars && b.messagingPillars.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Messaging Pillars</span>
          <ul className={styles.previewList}>
            {b.messagingPillars.slice(0, 2).map((m, i) => (
              <li key={i} className={styles.previewListItem}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function getBrandStrategyPreviewLines(content: Record<string, unknown>) {
  const b = content as unknown as BrandStrategy;
  const lines: string[] = [];
  if (b.brandPersonality) lines.push(b.brandPersonality);
  if (b.messagingPillars?.length > 0) lines.push(`Pillar: ${b.messagingPillars[0]}`);
  return lines;
}

function renderValueProposition(content: Record<string, unknown>) {
  const v = content as unknown as ValueProposition;
  return (
    <>
      {v.primaryBenefit && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Primary Benefit</h3>
          <p className={styles.sectionText}>{v.primaryBenefit}</p>
        </div>
      )}
      {v.keyDifferentiators?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Key Differentiators</h3>
          <ul className={styles.sectionList}>
            {v.keyDifferentiators.map((d, i) => <li key={i} className={styles.sectionListItem}>{d}</li>)}
          </ul>
        </div>
      )}
      {v.competitiveRationale && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Competitive Rationale</h3>
          <p className={styles.sectionText}>{v.competitiveRationale}</p>
        </div>
      )}
    </>
  );
}

function renderValuePropositionPreview(content: Record<string, unknown>) {
  const v = content as unknown as ValueProposition;
  return (
    <>
      <span className={styles.previewTitle}>Value Proposition</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Primary Benefit</span>
        <span className={styles.previewText}>{v.primaryBenefit}</span>
      </div>
      {v.keyDifferentiators && v.keyDifferentiators.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Differentiators</span>
          <ul className={styles.previewList}>
            {v.keyDifferentiators.slice(0, 2).map((d, i) => (
              <li key={i} className={styles.previewListItem}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function getValuePropositionPreviewLines(content: Record<string, unknown>) {
  const v = content as unknown as ValueProposition;
  const lines: string[] = [];
  if (v.primaryBenefit) lines.push(v.primaryBenefit);
  if (v.keyDifferentiators?.length > 0) lines.push(v.keyDifferentiators[0]);
  return lines;
}

function renderUserJourney(content: Record<string, unknown>) {
  const u = content as unknown as UserJourney;
  return (
    <>
      {u.stages?.map((stage, i) => (
        <div key={i} className={styles.section}>
          <h3 className={styles.sectionTitle}>{stage.stage}</h3>
          {stage.touchpoints?.length > 0 && (
            <p className={styles.sectionText}>Touchpoints: {stage.touchpoints.join(', ')}</p>
          )}
          {stage.emotions && (
            <p className={styles.sectionText}>Emotions: {stage.emotions}</p>
          )}
          {stage.painPoints?.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Pain Points</h4>
              <ul className={styles.sectionList}>
                {stage.painPoints.map((pp, j) => <li key={j} className={styles.sectionListItem}>{pp}</li>)}
              </ul>
            </>
          )}
          {stage.opportunities?.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Opportunities</h4>
              <ul className={styles.sectionList}>
                {stage.opportunities.map((o, j) => <li key={j} className={styles.sectionListItem}>{o}</li>)}
              </ul>
            </>
          )}
        </div>
      ))}
    </>
  );
}

function renderUserJourneyPreview(content: Record<string, unknown>) {
  const u = content as unknown as UserJourney;
  return (
    <>
      <span className={styles.previewTitle}>User Journey</span>
      {u.stages?.slice(0, 3).map((stage, i) => (
        <div key={i} className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>{stage.stage}</span>
          {stage.emotions && (
            <span className={styles.previewText}>{stage.emotions}</span>
          )}
          {stage.touchpoints && stage.touchpoints.length > 0 && (
            <span className={styles.previewText}>Touchpoints: {stage.touchpoints.slice(0, 2).join(', ')}</span>
          )}
        </div>
      ))}
    </>
  );
}

function getUserJourneyPreviewLines(content: Record<string, unknown>) {
  const u = content as unknown as UserJourney;
  const lines: string[] = [];
  if (u.stages) {
    u.stages.forEach((s) => lines.push(s.stage));
  }
  return lines;
}

function renderFeaturePrioritization(content: Record<string, unknown>) {
  const f = content as unknown as FeaturePrioritization;
  return (
    <>
      {f.framework && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Framework: {f.framework}</h3>
        </div>
      )}
      {f.features?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Features</h3>
          {f.features.map((feat, i) => (
            <div key={i} className={styles.personaCard}>
              <span className={styles.personaName}>{feat.name}</span>
              <span className={styles.personaRole}>{feat.category}</span>
              <ul className={styles.sectionList}>
                <li className={styles.sectionListItem}>Impact: {feat.impact}</li>
                <li className={styles.sectionListItem}>Effort: {feat.effort}</li>
                <li className={styles.sectionListItem}>Strategic Value: {feat.strategicValue}</li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function renderFeaturePrioritizationPreview(content: Record<string, unknown>) {
  const f = content as unknown as FeaturePrioritization;
  return (
    <>
      <span className={styles.previewTitle}>Feature Prioritization</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Framework: {f.framework}</span>
        {f.features && f.features.length > 0 && (
          <ul className={styles.previewList}>
            {f.features.slice(0, 3).map((feat, i) => (
              <li key={i} className={styles.previewListItem}>{feat.name} — {feat.category}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function getFeaturePrioritizationPreviewLines(content: Record<string, unknown>) {
  const f = content as unknown as FeaturePrioritization;
  const lines: string[] = [];
  if (f.framework) lines.push(`Framework: ${f.framework}`);
  if (f.features?.length > 0) lines.push(`${f.features.length} features`);
  return lines;
}

function renderCompetitiveAnalysis(content: Record<string, unknown>) {
  const c = content as unknown as CompetitiveAnalysis;
  return (
    <>
      {c.competitors?.map((comp, i) => (
        <div key={i} className={styles.personaCard}>
          <span className={styles.personaName}>{comp.name}</span>
          {comp.strengths?.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Strengths</h3>
              <ul className={styles.sectionList}>
                {comp.strengths.map((s, j) => <li key={j} className={styles.sectionListItem}>{s}</li>)}
              </ul>
            </div>
          )}
          {comp.weaknesses?.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Weaknesses</h3>
              <ul className={styles.sectionList}>
                {comp.weaknesses.map((w, j) => <li key={j} className={styles.sectionListItem}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}
      {c.differentiationOpportunities?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Differentiation Opportunities</h3>
          <ul className={styles.sectionList}>
            {c.differentiationOpportunities.map((d, i) => <li key={i} className={styles.sectionListItem}>{d}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function renderCompetitiveAnalysisPreview(content: Record<string, unknown>) {
  const c = content as unknown as CompetitiveAnalysis;
  return (
    <>
      <span className={styles.previewTitle}>Competitive Analysis</span>
      {c.competitors?.slice(0, 2).map((comp, i) => (
        <div key={i} className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>{comp.name}</span>
          {comp.strengths && comp.strengths.length > 0 && (
            <ul className={styles.previewList}>
              {comp.strengths.slice(0, 2).map((s, j) => (
                <li key={j} className={styles.previewListItem}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {c.differentiationOpportunities && c.differentiationOpportunities.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Opportunities</span>
          <span className={styles.previewText}>{c.differentiationOpportunities[0]}</span>
        </div>
      )}
    </>
  );
}

function getCompetitiveAnalysisPreviewLines(content: Record<string, unknown>) {
  const c = content as unknown as CompetitiveAnalysis;
  const lines: string[] = [];
  if (c.competitors) {
    c.competitors.forEach((comp) => lines.push(comp.name));
  }
  return lines;
}

function renderGoToMarketPlan(content: Record<string, unknown>) {
  const g = content as unknown as GoToMarketPlan;
  return (
    <>
      {g.launchStrategy && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Launch Strategy</h3>
          <p className={styles.sectionText}>{g.launchStrategy}</p>
        </div>
      )}
      {g.targetChannels?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Target Channels</h3>
          <ul className={styles.sectionList}>
            {g.targetChannels.map((c, i) => <li key={i} className={styles.sectionListItem}>{c}</li>)}
          </ul>
        </div>
      )}
      {g.messaging && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Messaging</h3>
          <p className={styles.sectionText}>{g.messaging}</p>
        </div>
      )}
      {g.first90DayMetrics?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>First 90-Day Metrics</h3>
          <ul className={styles.sectionList}>
            {g.first90DayMetrics.map((m, i) => <li key={i} className={styles.sectionListItem}>{m}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function renderGoToMarketPlanPreview(content: Record<string, unknown>) {
  const g = content as unknown as GoToMarketPlan;
  return (
    <>
      <span className={styles.previewTitle}>Go-To-Market Plan</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Launch Strategy</span>
        <span className={styles.previewText}>{g.launchStrategy}</span>
      </div>
      {g.targetChannels && g.targetChannels.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Target Channels</span>
          <ul className={styles.previewList}>
            {g.targetChannels.slice(0, 3).map((c, i) => (
              <li key={i} className={styles.previewListItem}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function getGoToMarketPlanPreviewLines(content: Record<string, unknown>) {
  const g = content as unknown as GoToMarketPlan;
  const lines: string[] = [];
  if (g.launchStrategy) lines.push(g.launchStrategy);
  if (g.targetChannels?.length > 0) lines.push(`Channels: ${g.targetChannels.join(', ')}`);
  return lines;
}

function renderLandingPageCopy(content: Record<string, unknown>) {
  const l = content as unknown as LandingPageCopy;
  return (
    <>
      {l.headline && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Headline</h3>
          <p className={styles.sectionText}>{l.headline}</p>
        </div>
      )}
      {l.subheadline && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Subheadline</h3>
          <p className={styles.sectionText}>{l.subheadline}</p>
        </div>
      )}
      {l.keyBenefits?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Key Benefits</h3>
          <ul className={styles.sectionList}>
            {l.keyBenefits.map((b, i) => <li key={i} className={styles.sectionListItem}>{b}</li>)}
          </ul>
        </div>
      )}
      {l.socialProof && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Social Proof</h3>
          <p className={styles.sectionText}>{l.socialProof}</p>
        </div>
      )}
      {l.callToAction && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Call to Action</h3>
          <p className={styles.sectionText}>{l.callToAction}</p>
        </div>
      )}
    </>
  );
}

function renderLandingPageCopyPreview(content: Record<string, unknown>) {
  const l = content as unknown as LandingPageCopy;
  return (
    <>
      <span className={styles.previewTitle}>Landing Page Copy</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Headline</span>
        <span className={styles.previewText}>{l.headline}</span>
      </div>
      {l.subheadline && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Subheadline</span>
          <span className={styles.previewText}>{l.subheadline}</span>
        </div>
      )}
      {l.keyBenefits && l.keyBenefits.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Key Benefits</span>
          <ul className={styles.previewList}>
            {l.keyBenefits.slice(0, 2).map((b, i) => (
              <li key={i} className={styles.previewListItem}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function getLandingPageCopyPreviewLines(content: Record<string, unknown>) {
  const l = content as unknown as LandingPageCopy;
  const lines: string[] = [];
  if (l.headline) lines.push(l.headline);
  if (l.subheadline) lines.push(l.subheadline);
  return lines;
}

function renderDesignDirection(content: Record<string, unknown>) {
  const d = content as unknown as DesignDirection;
  return (
    <>
      {d.layoutPrinciples && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Layout Principles</h3>
          <p className={styles.sectionText}>{d.layoutPrinciples}</p>
        </div>
      )}
      {d.typography && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Typography</h3>
          <p className={styles.sectionText}>{d.typography}</p>
        </div>
      )}
      {d.colorPalette && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Color Palette</h3>
          <p className={styles.sectionText}>{d.colorPalette}</p>
        </div>
      )}
      {d.interactionPatterns && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Interaction Patterns</h3>
          <p className={styles.sectionText}>{d.interactionPatterns}</p>
        </div>
      )}
    </>
  );
}

function renderDesignDirectionPreview(content: Record<string, unknown>) {
  const d = content as unknown as DesignDirection;
  return (
    <>
      <span className={styles.previewTitle}>Design Direction</span>
      <div className={styles.previewSection}>
        <span className={styles.previewSectionHeading}>Layout</span>
        <span className={styles.previewText}>{d.layoutPrinciples}</span>
      </div>
      {d.typography && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Typography</span>
          <span className={styles.previewText}>{d.typography}</span>
        </div>
      )}
      {d.colorPalette && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Color Palette</span>
          <span className={styles.previewText}>{d.colorPalette}</span>
        </div>
      )}
    </>
  );
}

function getDesignDirectionPreviewLines(content: Record<string, unknown>) {
  const d = content as unknown as DesignDirection;
  const lines: string[] = [];
  if (d.layoutPrinciples) lines.push(d.layoutPrinciples);
  if (d.colorPalette) lines.push(d.colorPalette);
  return lines;
}

function renderContentStrategy(content: Record<string, unknown>) {
  const cs = content as unknown as ContentStrategy;
  return (
    <>
      {cs.contentTypes?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Content Types</h3>
          <ul className={styles.sectionList}>
            {cs.contentTypes.map((ct, i) => <li key={i} className={styles.sectionListItem}>{ct}</li>)}
          </ul>
        </div>
      )}
      {cs.tone && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tone</h3>
          <p className={styles.sectionText}>{cs.tone}</p>
        </div>
      )}
      {cs.distributionChannels?.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Distribution Channels</h3>
          <ul className={styles.sectionList}>
            {cs.distributionChannels.map((ch, i) => <li key={i} className={styles.sectionListItem}>{ch}</li>)}
          </ul>
        </div>
      )}
      {cs.publishingCadence && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Publishing Cadence</h3>
          <p className={styles.sectionText}>{cs.publishingCadence}</p>
        </div>
      )}
    </>
  );
}

function renderContentStrategyPreview(content: Record<string, unknown>) {
  const cs = content as unknown as ContentStrategy;
  return (
    <>
      <span className={styles.previewTitle}>Content Strategy</span>
      {cs.contentTypes && cs.contentTypes.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Content Types</span>
          <ul className={styles.previewList}>
            {cs.contentTypes.slice(0, 3).map((ct, i) => (
              <li key={i} className={styles.previewListItem}>{ct}</li>
            ))}
          </ul>
        </div>
      )}
      {cs.tone && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Tone</span>
          <span className={styles.previewText}>{cs.tone}</span>
        </div>
      )}
      {cs.distributionChannels && cs.distributionChannels.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.previewSectionHeading}>Distribution</span>
          <span className={styles.previewText}>{cs.distributionChannels.slice(0, 2).join(', ')}</span>
        </div>
      )}
    </>
  );
}

function getContentStrategyPreviewLines(content: Record<string, unknown>) {
  const cs = content as unknown as ContentStrategy;
  const lines: string[] = [];
  if (cs.contentTypes?.length > 0) lines.push(`Types: ${cs.contentTypes.join(', ')}`);
  if (cs.tone) lines.push(cs.tone);
  return lines;
}

const registry: ArtifactRenderer[] = [
  { type: 'startup_analysis', label: 'Startup Analysis', render: renderStartupAnalysis, renderPreview: renderStartupAnalysisPreview, getPreviewLines: getStartupAnalysisPreviewLines },
  { type: 'personas', label: 'User Personas', render: renderPersonas, renderPreview: renderPersonasPreview, getPreviewLines: getPersonasPreviewLines },
  { type: 'mvp_scope', label: 'MVP Scope', render: renderMvpScope, renderPreview: renderMvpScopePreview, getPreviewLines: getMvpScopePreviewLines },
  { type: 'roadmap', label: 'Product Roadmap', render: renderRoadmap, renderPreview: renderRoadmapPreview, getPreviewLines: getRoadmapPreviewLines },
  { type: 'health_score', label: 'Health Score', render: renderHealthScore, renderPreview: renderHealthScorePreview, getPreviewLines: getHealthScorePreviewLines },
  { type: 'positioning_statement', label: 'Positioning Statement', render: renderPositioningStatement, renderPreview: renderPositioningStatementPreview, getPreviewLines: getPositioningStatementPreviewLines },
  { type: 'brand_strategy', label: 'Brand Strategy', render: renderBrandStrategy, renderPreview: renderBrandStrategyPreview, getPreviewLines: getBrandStrategyPreviewLines },
  { type: 'value_proposition', label: 'Value Proposition', render: renderValueProposition, renderPreview: renderValuePropositionPreview, getPreviewLines: getValuePropositionPreviewLines },
  { type: 'user_journey', label: 'User Journey', render: renderUserJourney, renderPreview: renderUserJourneyPreview, getPreviewLines: getUserJourneyPreviewLines },
  { type: 'feature_prioritization', label: 'Feature Prioritization', render: renderFeaturePrioritization, renderPreview: renderFeaturePrioritizationPreview, getPreviewLines: getFeaturePrioritizationPreviewLines },
  { type: 'competitive_analysis', label: 'Competitive Analysis', render: renderCompetitiveAnalysis, renderPreview: renderCompetitiveAnalysisPreview, getPreviewLines: getCompetitiveAnalysisPreviewLines },
  { type: 'gtm_plan', label: 'Go-To-Market Plan', render: renderGoToMarketPlan, renderPreview: renderGoToMarketPlanPreview, getPreviewLines: getGoToMarketPlanPreviewLines },
  { type: 'landing_page_copy', label: 'Landing Page Copy', render: renderLandingPageCopy, renderPreview: renderLandingPageCopyPreview, getPreviewLines: getLandingPageCopyPreviewLines },
  { type: 'design_direction', label: 'Design Direction', render: renderDesignDirection, renderPreview: renderDesignDirectionPreview, getPreviewLines: getDesignDirectionPreviewLines },
  { type: 'content_strategy', label: 'Content Strategy', render: renderContentStrategy, renderPreview: renderContentStrategyPreview, getPreviewLines: getContentStrategyPreviewLines },
];

const rendererMap = new Map<ArtifactType, ArtifactRenderer>(
  registry.map((r) => [r.type, r])
);

export function renderArtifact(type: ArtifactType, content: Record<string, unknown>): React.ReactNode {
  const renderer = rendererMap.get(type);
  if (!renderer) {
    return <pre style={{ fontSize: 'var(--body-small-font-size)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--on-surface-variant)' }}>{JSON.stringify(content, null, 2)}</pre>;
  }
  return renderer.render(content);
}

export function renderArtifactPreview(type: ArtifactType, content: Record<string, unknown>): React.ReactNode {
  const renderer = rendererMap.get(type);
  if (!renderer) {
    return <span className={styles.previewText}>No preview available</span>;
  }
  return renderer.renderPreview(content);
}

export function getArtifactLabel(type: ArtifactType): string {
  return rendererMap.get(type)?.label ?? type;
}

export function getArtifactPreview(type: ArtifactType, content: Record<string, unknown>): string[] {
  const renderer = rendererMap.get(type);
  if (!renderer) return ['No preview available'];
  return renderer.getPreviewLines(content);
}
