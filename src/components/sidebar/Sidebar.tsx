'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api/client';
import { SidebarHeader } from '@/components/layout/SidebarHeader';
import { SidebarNavigation } from '@/components/layout/SidebarNavigation';
import { SidebarProjects } from '@/components/layout/SidebarProjects';
import { SidebarUser } from '@/components/layout/SidebarUser';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import type { Project } from '@/types';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed') === 'true';
      document.documentElement.style.setProperty(
        '--sidebar-width',
        saved ? '72px' : '280px'
      );
      return saved;
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const activeProjectId = pathname.startsWith('/dashboard/')
    ? pathname.split('/')[2]
    : undefined;

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '72px' : '280px'
    );
  }, [collapsed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/api/projects');
      const result = await res.json();
      if (result.success) {
        setProjects(result.data || []);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    const handleResize = () => {
      checkMobile();
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };
    const handleToggle = () => setMobileOpen((p) => !p);
    const handleProjectsUpdated = () => fetchProjects();
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar:toggle', handleToggle);
    window.addEventListener('projects:updated', handleProjectsUpdated);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar:toggle', handleToggle);
      window.removeEventListener('projects:updated', handleProjectsUpdated);
    };
  }, [fetchProjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/dashboard');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, router]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    let startX = 0;
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      if (isMobile) {
        if (diff > 80 && !mobileOpen) setMobileOpen(true);
        if (diff < -80 && mobileOpen) setMobileOpen(false);
      }
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, mobileOpen]);

  const handleNewProject = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    setSignOutOpen(true);
  };

  const handleConfirmLogout = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  };

  const sidebarClasses = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    mobileOpen ? styles.mobileOpen : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {mobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={sidebarClasses}
        aria-label="Workspace navigation"
        aria-hidden={isMobile && !mobileOpen || undefined}
        tabIndex={isMobile && !mobileOpen ? -1 : undefined}
      >
        <div className={styles.inner}>
          <SidebarHeader
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            onNewProject={handleNewProject}
          />

          <SidebarNavigation collapsed={collapsed} />

          {loading ? (
            <div className={styles.skeletonProjects} aria-label="Loading projects" role="status" aria-live="polite">
              {Array.from({ length: collapsed ? 2 : 3 }).map((_, i) => (
                <div key={i} className={collapsed ? styles.skeletonProjectCollapsed : styles.skeletonProject}>
                  <Skeleton
                    height={14}
                    width={collapsed ? 20 : `${50 + i * 15}%`}
                    borderRadius={collapsed ? '50%' : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            <SidebarProjects
              collapsed={collapsed}
              projects={projects}
              activeProjectId={activeProjectId}
            />
          )}

          <SidebarUser
            collapsed={collapsed}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      <ConfirmDialog
        open={signOutOpen}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        icon={<LogOut size={24} aria-hidden="true" />}
        onConfirm={handleConfirmLogout}
        onCancel={() => { setSignOutOpen(false); }}
        loading={signingOut}
        destructive
      />
    </>
  );
}
