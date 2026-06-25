'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Monitor,
  Bell,
  Sparkles,
  FolderKanban,
  Download,
  Shield,
  Crown,
  HelpCircle,
  LogOut,
  Trash2,
  Moon,
  Sun,
  Check,
  AlertTriangle,
  BookOpen,
  Bug,
  MessageSquare,
} from 'lucide-react';
import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import styles from './settings.module.css';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  density: 'default' | 'compact';
  reduceMotion: boolean;
  sidebarDefaultCollapsed: boolean;
  productUpdates: boolean;
  aiCompletion: boolean;
  exportCompletion: boolean;
  emailNotifications: boolean;
  responseLength: 'concise' | 'balanced' | 'detailed';
  autoGenerateArtifacts: boolean;
  autoSave: boolean;
  projectOrganization: 'list' | 'grid';
  preferredFormat: 'pdf' | 'docx' | 'md' | 'pptx';
}

type SectionId =
  | 'account'
  | 'appearance'
  | 'notifications'
  | 'ai-preferences'
  | 'project-preferences'
  | 'export-preferences'
  | 'privacy-security'
  | 'billing'
  | 'support'
  | 'account-actions';

interface Section {
  id: SectionId;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const SECTIONS: Section[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ai-preferences', label: 'AI Preferences', icon: Sparkles },
  { id: 'project-preferences', label: 'Project Preferences', icon: FolderKanban },
  { id: 'export-preferences', label: 'Export Preferences', icon: Download },
  { id: 'privacy-security', label: 'Privacy & Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: Crown },
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'account-actions', label: 'Account Actions', icon: LogOut },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

const DENSITY_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
] as const;

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'md', label: 'Markdown' },
  { value: 'pptx', label: 'PPTX' },
] as const;

const ORGANIZATION_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
] as const;

const LENGTH_OPTIONS = [
  { value: 'concise', label: 'Concise' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
] as const;

const STORAGE_KEY = 'origina-settings';

function loadSettings(): SettingsState {
  if (typeof window === 'undefined') return defaultSettings();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultSettings(), ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultSettings();
}

function defaultSettings(): SettingsState {
  return {
    theme: 'system',
    density: 'default',
    reduceMotion: false,
    sidebarDefaultCollapsed: false,
    productUpdates: true,
    aiCompletion: true,
    exportCompletion: true,
    emailNotifications: false,
    responseLength: 'balanced',
    autoGenerateArtifacts: false,
    autoSave: true,
    projectOrganization: 'list',
    preferredFormat: 'pdf',
  };
}

function saveSettings(settings: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

function applyTheme(theme: SettingsState['theme']) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    root.dataset.theme = theme;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<{ name: string; email: string; created_at: string; provider: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    const meta = authUser.user_metadata;
    const provider = authUser.app_metadata?.provider || 'email';
    setUser({
      name: meta?.full_name || meta?.name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      created_at: authUser.created_at,
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
    });
  }, [authUser, authLoading, router]);

  useEffect(() => {
    if (!deleteConfirmOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const prev = document.activeElement as HTMLElement | null;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeleteConfirmOpen(false);
        setDeleteConfirmText('');
        return;
      }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      prev?.focus();
    };
  }, [deleteConfirmOpen]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const handleSignOut = useCallback(() => {
    setSignOutConfirmOpen(true);
  }, []);

  const handleConfirmSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      setSigningOut(false);
      setSignOutConfirmOpen(false);
    }
  }, [router]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await api.del('/api/auth/delete-account');
    } catch { /* ignore */ }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }, [deleteConfirmText, router]);

  const activeSectionMeta = SECTIONS.find((s) => s.id === activeSection);

  const activeSectionLabel = activeSectionMeta?.label || '';

  return (
    <div className={styles.page}>
      <a href="#settings-content" className={styles.skipLink}>Skip to content</a>

      <div className={styles.mobileHeader}>
        <h1 className={styles.mobileTitle}>Settings</h1>
        <button
          className={styles.sectionBtn}
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open settings sections"
          aria-expanded={mobileNavOpen}
        >
          {activeSectionLabel}
        </button>
      </div>

      {mobileNavOpen && (
        <>
          <div
            className={styles.mobileNavOverlay}
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <nav
            className={`${styles.mobileNavDrawer} ${mobileNavOpen ? styles.mobileNavOpen : ''}`}
            aria-label="Settings sections"
          >
            <h2 className={styles.mobileNavTitle}>Settings</h2>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`${styles.mobileNavItem} ${activeSection === section.id ? styles.mobileNavItemActive : ''}`}
                  onClick={() => { setActiveSection(section.id); setMobileNavOpen(false); setStatusMessage(`${section.label} settings loaded`); }}
                  aria-current={activeSection === section.id ? 'true' : undefined}
                >
                  <Icon size={16} aria-hidden="true" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </>
      )}

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Settings sections">
          <h2 className={styles.navTitle}>Settings</h2>
          <div className={styles.navList} role="tablist" aria-orientation="vertical">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  role="tab"
                  aria-selected={activeSection === section.id}
                  className={`${styles.navItem} ${activeSection === section.id ? styles.navItemActive : ''}`}
                  onClick={() => { setActiveSection(section.id); setMobileNavOpen(false); }}
                  aria-label={section.label}
                >
                  <Icon size={16} className={styles.navIcon} aria-hidden="true" />
                  <span className={styles.navLabel}>{section.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <main id="settings-content" className={styles.content} role="tabpanel" aria-label={activeSectionMeta?.label} tabIndex={-1}>
          {activeSection === 'account' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Account</h2>
              <p className={styles.sectionDesc}>View your account details and personal information.</p>

              <div className={styles.card}>
                {authLoading ? (
                  <div className={styles.skeletonProfile} aria-label="Loading profile" role="status" aria-live="polite">
                    <div className={styles.skeletonProfileRow}>
                      <SkeletonAvatar size={48} />
                      <div className={styles.skeletonProfileFields}>
                        <Skeleton height={14} width={120} />
                        <Skeleton height={12} width={80} />
                      </div>
                    </div>
                    <div className={styles.skeletonProfileDivider} />
                    <Skeleton height={14} width={100} />
                    <div className={styles.skeletonProfileDivider} />
                    <Skeleton height={14} width={180} />
                    <div className={styles.skeletonProfileDivider} />
                    <Skeleton height={14} width={150} />
                  </div>
                ) : user ? (
                  <>
                    <div className={styles.field}>
                      <div className={styles.identitySection}>
                        <div className={styles.avatar}>
                          <span className={styles.avatarText}>
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className={styles.identityInfo}>
                          <span className={styles.identityName}>{user.name}</span>
                          <span className={styles.identityEmail}>{user.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Member since</span>
                      <span className={styles.fieldValue}>
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Authentication</span>
                      <span className={styles.fieldValue}>{user.provider}</span>
                    </div>
                  </>
                ) : (
                  <div className={styles.errorState}>Unable to load profile.</div>
                )}
              </div>
            </section>
          )}

          {activeSection === 'appearance' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Appearance</h2>
              <p className={styles.sectionDesc}>Customize how Origina looks and behaves.</p>

              <div className={styles.card}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Theme</span>
                  <div className={styles.themeOptions}>
                    {THEME_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          className={`${styles.themeOption} ${settings.theme === opt.value ? styles.themeOptionActive : ''}`}
                          onClick={() => updateSetting('theme', opt.value)}
                          aria-label={opt.label}
                          aria-pressed={settings.theme === opt.value}
                        >
                          <Icon size={18} aria-hidden="true" />
                          <span>{opt.label}</span>
                          {settings.theme === opt.value && <Check size={14} className={styles.themeCheck} aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Density</span>
                  <div className={styles.toggleGroup}>
                    {DENSITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.toggleBtn} ${settings.density === opt.value ? styles.toggleBtnActive : ''}`}
                        onClick={() => updateSetting('density', opt.value)}
                        aria-pressed={settings.density === opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Reduce motion</span>
                      <p className={styles.fieldHint}>Minimize animations throughout the app.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.reduceMotion ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
                      role="switch"
                      aria-checked={settings.reduceMotion}
                      aria-label="Reduce motion"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Sidebar default state</span>
                      <p className={styles.fieldHint}>Start with the sidebar collapsed on new sessions.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.sidebarDefaultCollapsed ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('sidebarDefaultCollapsed', !settings.sidebarDefaultCollapsed)}
                      role="switch"
                      aria-checked={settings.sidebarDefaultCollapsed}
                      aria-label="Sidebar default collapsed"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'notifications' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <p className={styles.sectionDesc}>Control which notifications you receive.</p>

              <div className={styles.card}>
                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Product updates</span>
                      <p className={styles.fieldHint}>New features and improvements.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.productUpdates ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('productUpdates', !settings.productUpdates)}
                      role="switch"
                      aria-checked={settings.productUpdates}
                      aria-label="Product updates"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>AI generation complete</span>
                      <p className={styles.fieldHint}>When an AI artifact finishes generating.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.aiCompletion ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('aiCompletion', !settings.aiCompletion)}
                      role="switch"
                      aria-checked={settings.aiCompletion}
                      aria-label="AI generation notifications"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Export complete</span>
                      <p className={styles.fieldHint}>When an export finishes processing.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.exportCompletion ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('exportCompletion', !settings.exportCompletion)}
                      role="switch"
                      aria-checked={settings.exportCompletion}
                      aria-label="Export notifications"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Email notifications</span>
                      <p className={styles.fieldHint}>Receive notifications via email.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.emailNotifications ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                      role="switch"
                      aria-checked={settings.emailNotifications}
                      aria-label="Email notifications"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'ai-preferences' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>AI Preferences</h2>
              <p className={styles.sectionDesc}>Configure how the AI assistant behaves.</p>

              <div className={styles.card}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Default AI provider</span>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.select}
                      value="openai"
                      aria-label="AI provider"
                      disabled
                    >
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>
                  <p className={styles.fieldHint}>More providers coming soon.</p>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Response length</span>
                  <div className={styles.toggleGroup}>
                    {LENGTH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.toggleBtn} ${settings.responseLength === opt.value ? styles.toggleBtnActive : ''}`}
                        onClick={() => updateSetting('responseLength', opt.value)}
                        aria-pressed={settings.responseLength === opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Auto-generate artifacts</span>
                      <p className={styles.fieldHint}>Automatically generate relevant artifacts from conversations.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.autoGenerateArtifacts ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('autoGenerateArtifacts', !settings.autoGenerateArtifacts)}
                      role="switch"
                      aria-checked={settings.autoGenerateArtifacts}
                      aria-label="Auto-generate artifacts"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Assistant behavior</span>
                  <p className={styles.fieldValue}>Adaptive</p>
                  <p className={styles.fieldHint}>The assistant adapts its tone and depth based on context.</p>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'project-preferences' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Project Preferences</h2>
              <p className={styles.sectionDesc}>Manage how projects work by default.</p>

              <div className={styles.card}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Default project view</span>
                  <p className={styles.fieldValue}>Workspace</p>
                  <p className={styles.fieldHint}>Projects open in the conversation workspace by default.</p>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Auto-save</span>
                      <p className={styles.fieldHint}>Automatically save changes as you work.</p>
                    </div>
                    <button
                      className={`${styles.switch} ${settings.autoSave ? styles.switchOn : ''}`}
                      onClick={() => updateSetting('autoSave', !settings.autoSave)}
                      role="switch"
                      aria-checked={settings.autoSave}
                      aria-label="Auto-save"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Project organization</span>
                  <div className={styles.toggleGroup}>
                    {ORGANIZATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.toggleBtn} ${settings.projectOrganization === opt.value ? styles.toggleBtnActive : ''}`}
                        onClick={() => updateSetting('projectOrganization', opt.value)}
                        aria-pressed={settings.projectOrganization === opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'export-preferences' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Export Preferences</h2>
              <p className={styles.sectionDesc}>Configure default export settings.</p>

              <div className={styles.card}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Preferred format</span>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.select}
                      value={settings.preferredFormat}
                      onChange={(e) => updateSetting('preferredFormat', e.target.value as SettingsState['preferredFormat'])}
                      aria-label="Preferred export format"
                    >
                      {FORMAT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Default document settings</span>
                  <p className={styles.fieldValue}>Standard</p>
                  <p className={styles.fieldHint}>Documents include title page, table of contents, and section headers.</p>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Export history</span>
                  <p className={styles.fieldValue}>Available in project workspace</p>
                  <p className={styles.fieldHint}>View your recent exports from each project&apos;s artifact panel.</p>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'privacy-security' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacy & Security</h2>
              <p className={styles.sectionDesc}>Manage your account security and data.</p>

              <div className={styles.card}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Active sessions</span>
                  <p className={styles.fieldValue}>1 active session</p>
                  <p className={styles.fieldHint}>You are logged in on this device. Sign out from other devices in your account settings.</p>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Account security</span>
                  <p className={styles.fieldValue}>Password authentication</p>
                  <p className={styles.fieldHint}>Your account is secured with email and password.</p>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Data & privacy</span>
                  <p className={styles.fieldValue}>Your data is encrypted in transit and at rest.</p>
                  <p className={styles.fieldHint}>We use industry-standard encryption to protect your information. View our privacy policy for details.</p>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'billing' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Billing</h2>
              <p className={styles.sectionDesc}>Manage your plan and usage.</p>

              <div className={styles.card}>
                <div className={styles.planCard}>
                  <Crown size={24} className={styles.planIcon} aria-hidden="true" />
                  <div className={styles.planInfo}>
                    <span className={styles.planName}>Free Plan</span>
                    <p className={styles.planDesc}>You are currently on the free plan. Upgrade to unlock more projects and features.</p>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Usage this month</span>
                  <div className={styles.usageBar}>
                    <div className={styles.usageFill} style={{ width: '0%' }} />
                  </div>
                  <p className={styles.fieldHint}>0 / 20 AI requests used this hour. 0 / 100 used today.</p>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'support' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Support</h2>
              <p className={styles.sectionDesc}>Get help and provide feedback.</p>

              <div className={styles.card}>
                <div className={styles.actionItem}>
                  <BookOpen size={18} aria-hidden="true" />
                  <div className={styles.actionContent}>
                    <span className={styles.actionLabel}>Documentation</span>
                    <span className={styles.actionHint}>Coming soon</span>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.actionItem}>
                  <Bug size={18} aria-hidden="true" />
                  <div className={styles.actionContent}>
                    <span className={styles.actionLabel}>Report a bug</span>
                    <span className={styles.actionHint}>Coming soon</span>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.actionItem}>
                  <MessageSquare size={18} aria-hidden="true" />
                  <div className={styles.actionContent}>
                    <span className={styles.actionLabel}>Feedback</span>
                    <span className={styles.actionHint}>Coming soon</span>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.actionItem}>
                  <HelpCircle size={18} aria-hidden="true" />
                  <div className={styles.actionContent}>
                    <span className={styles.actionLabel}>Help center</span>
                    <span className={styles.actionHint}>Coming soon</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'account-actions' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Account Actions</h2>
              <p className={styles.sectionDesc}>Manage your account.</p>

              <div className={styles.card}>
                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Sign out</span>
                      <p className={styles.fieldHint}>Sign out of your account on this device.</p>
                    </div>
                    <button
                      className={styles.signOutBtn}
                      onClick={handleSignOut}
                      aria-label="Sign out"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              <ConfirmDialog
                open={signOutConfirmOpen}
                title="Sign out"
                message="Are you sure you want to sign out?"
                confirmLabel="Sign Out"
                icon={<LogOut size={24} aria-hidden="true" />}
                onConfirm={handleConfirmSignOut}
                onCancel={() => { setSignOutConfirmOpen(false); }}
                loading={signingOut}
                destructive
              />

              <div className={`${styles.card} ${styles.dangerCard}`}>
                <div className={styles.field}>
                  <div className={styles.fieldRow}>
                    <div>
                      <span className={styles.fieldLabel}>Delete account</span>
                      <p className={styles.fieldHint}>Permanently delete your account and all data. This action cannot be undone.</p>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setDeleteConfirmOpen(true)}
                      aria-label="Delete account"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {deleteConfirmOpen && (
                <div className={styles.confirmOverlay} onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}>
                  <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-title">
                    <AlertTriangle size={24} className={styles.confirmIcon} aria-hidden="true" />
                    <h3 id="delete-title" className={styles.confirmTitle}>Delete account</h3>
                    <p className={styles.confirmDesc}>
                      This will permanently delete your account and all associated data. 
                      Type <strong>DELETE</strong> to confirm.
                    </p>
                    <input
                      className={styles.confirmInput}
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      aria-label="Type DELETE to confirm"
                      autoFocus
                    />
                    <div className={styles.confirmActions}>
                      <button
                        className={styles.confirmCancel}
                        onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.confirmDelete}
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE'}
                      >
                        Delete account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {statusMessage}
      </div>
    </div>
  );
}
