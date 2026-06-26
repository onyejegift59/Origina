export const AI_RATE_LIMIT = {
  requestsPerHour: 20,
  requestsPerDay: 100,
};

export const ASSISTANT_RATE_LIMIT = {
  requestsPerHour: 10,
  requestsPerDay: 50,
};

export const ARTIFACT_TYPES = [
  'startup_analysis',
  'personas',
  'mvp_scope',
  'roadmap',
  'health_score',
  'positioning_statement',
  'brand_strategy',
  'value_proposition',
  'user_journey',
  'feature_prioritization',
  'competitive_analysis',
  'gtm_plan',
  'landing_page_copy',
  'design_direction',
  'content_strategy',
] as const;

export const EXPORT_FORMATS = ['pdf', 'docx', 'markdown', 'pptx'] as const;

export const ARTIFACT_LABELS: Record<string, string> = {
  startup_analysis: 'Startup Analysis',
  personas: 'User Personas',
  mvp_scope: 'MVP Scope',
  roadmap: 'Product Roadmap',
  health_score: 'Health Score',
  positioning_statement: 'Positioning Statement',
  brand_strategy: 'Brand Strategy',
  value_proposition: 'Value Proposition',
  user_journey: 'User Journey',
  feature_prioritization: 'Feature Prioritization',
  competitive_analysis: 'Competitive Analysis',
  gtm_plan: 'Go-To-Market Plan',
  landing_page_copy: 'Landing Page Copy',
  design_direction: 'Design Direction',
  content_strategy: 'Content Strategy',
};
