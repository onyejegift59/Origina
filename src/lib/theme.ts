const STORAGE_KEY = 'origina-settings';

type Theme = 'light' | 'dark' | 'system';

function getSavedTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.theme) return parsed.theme;
    }
  } catch {
    // localStorage unavailable
  }
  return 'system';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    root.dataset.theme = theme;
  }
}

export function initializeTheme(): void {
  const theme = getSavedTheme();
  applyTheme(theme);

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const current = getSavedTheme();
    applyTheme(current);
  };
  mq.addEventListener('change', handler);
}
