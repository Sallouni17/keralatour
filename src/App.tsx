import React, { useState, useEffect } from 'react';
import { Navbar } from './components/public/Navbar.tsx';
import { Footer } from './components/public/Footer.tsx';
import { HomeView } from './components/public/HomeView.tsx';
import { DestinationView } from './components/public/DestinationView.tsx';
import { PackageDetailView } from './components/public/PackageDetailView.tsx';
import { SearchView } from './components/public/SearchView.tsx';
import { PrivacyView } from './components/public/PrivacyView.tsx';
import { EnquiryDrawer } from './components/public/EnquiryDrawer.tsx';
import { QuoteDetailView } from './components/public/QuoteDetailView.tsx';
import { BlogListView } from './components/public/BlogListView.tsx';
import { BlogPostView } from './components/public/BlogPostView.tsx';

import { AdminLayout } from './components/admin/AdminLayout.tsx';
import { AdminLoginView } from './components/admin/AdminLoginView.tsx';
import { AdminDashboardView } from './components/admin/AdminDashboardView.tsx';
import { AdminPackageListView } from './components/admin/AdminPackageListView.tsx';
import { AdminPackageEditorView } from './components/admin/AdminPackageEditorView.tsx';
import { AdminEnquiryInboxView } from './components/admin/AdminEnquiryInboxView.tsx';
import { AdminEnquiryDetailView } from './components/admin/AdminEnquiryDetailView.tsx';
import { AdminActivityLogView } from './components/admin/AdminActivityLogView.tsx';
import { ManualEnquiryModal } from './components/admin/ManualEnquiryModal.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Global Public Data
  const [destinations, setDestinations] = useState<any[]>([]);
  const [publishedPackages, setPublishedPackages] = useState<any[]>([]);

  // Public Enquiry Drawer
  const [enquiryDrawerOpen, setEnquiryDrawerOpen] = useState(false);
  const [enquiryPackage, setEnquiryPackage] = useState<any>(null);

  // Admin Manual Lead Modal
  const [manualEnquiryOpen, setManualEnquiryOpen] = useState(false);

  // Sync route on popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check auth session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  // Load public catalogue
  useEffect(() => {
    fetch('/api/destinations')
      .then((res) => res.json())
      .then((data) => setDestinations(data.destinations || []))
      .catch(console.error);

    fetch('/api/packages')
      .then((res) => res.json())
      .then((data) => setPublishedPackages(data.packages || []))
      .catch(console.error);
  }, []);

  const navigate = (path: string) => {
    if (path.startsWith('/#')) {
      // Anchor link on home page
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      }
      setTimeout(() => {
        const id = path.replace('/#', '');
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEnquiry = (packageId?: string) => {
    if (packageId) {
      const found = publishedPackages.find((p) => p.id === packageId);
      setEnquiryPackage(found || null);
    } else {
      setEnquiryPackage(null);
    }
    setEnquiryDrawerOpen(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
    navigate('/');
  };

  // --------------------------------------------------------------------------
  // ADMIN ROUTING
  // --------------------------------------------------------------------------
  if (currentPath.startsWith('/admin')) {
    if (checkingAuth) {
      return (
        <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center text-xs text-stone-500 font-mono">
          Verifying operational access credentials...
        </div>
      );
    }

    if (!currentUser) {
      return (
        <AdminLoginView
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            navigate('/admin/dashboard');
          }}
          onNavigateHome={() => navigate('/')}
        />
      );
    }

    // Role-based routing guard
    const renderAdminContent = () => {
      // 1. Dashboard
      if (currentPath === '/admin' || currentPath === '/admin/dashboard') {
        return (
          <AdminDashboardView
            onNavigate={navigate}
            onOpenManualEnquiry={() => setManualEnquiryOpen(true)}
          />
        );
      }

      // 2. Packages List (ADMIN or EDITOR)
      if (currentPath === '/admin/packages') {
        if (currentUser.role === 'CONSULTANT') {
          return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-700 text-xs">
              Access Forbidden: Consultant role is restricted to enquiry inbox triage.
            </div>
          );
        }
        return (
          <AdminPackageListView
            onNavigate={navigate}
            onOpenPreview={(previewPath) => navigate(previewPath)}
          />
        );
      }

      // 3. Package Editor (ADMIN or EDITOR)
      if (currentPath.startsWith('/admin/packages/')) {
        if (currentUser.role === 'CONSULTANT') {
          return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-700 text-xs">
              Access Forbidden: Consultant role cannot edit tour packages.
            </div>
          );
        }
        const pkgId = currentPath.replace('/admin/packages/', '').split('?')[0];
        return (
          <AdminPackageEditorView
            packageId={pkgId}
            onNavigate={navigate}
            onOpenPreview={(previewPath) => navigate(previewPath)}
          />
        );
      }

      // 4. Enquiry Inbox (ADMIN or CONSULTANT)
      if (currentPath.startsWith('/admin/enquiries')) {
        if (currentUser.role === 'EDITOR') {
          return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-700 text-xs">
              Access Forbidden: Editor role is restricted to package CMS management.
            </div>
          );
        }

        const enquiryIdMatch = currentPath.match(/\/admin\/enquiries\/([a-zA-Z0-9_-]+)/);
        if (enquiryIdMatch) {
          const enqId = enquiryIdMatch[1];
          return (
            <AdminEnquiryDetailView
              enquiryId={enqId}
              onNavigate={navigate}
              currentUserRole={currentUser.role}
            />
          );
        }

        const isOverdue = currentPath.includes('overdue=true');
        return (
          <AdminEnquiryInboxView
            onNavigate={navigate}
            onSelectEnquiry={(id) => navigate(`/admin/enquiries/${id}`)}
            onOpenManualEnquiry={() => setManualEnquiryOpen(true)}
            initialOverdueFilter={isOverdue}
          />
        );
      }

      // 5. Activity Log (ADMIN only)
      if (currentPath === '/admin/activity') {
        if (currentUser.role !== 'ADMIN') {
          return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-700 text-xs">
              Access Forbidden: Only Managing Director (ADMIN) may view the complete security audit trail.
            </div>
          );
        }
        return <AdminActivityLogView />;
      }

      return (
        <div className="p-8 text-center text-xs text-stone-500">
          Admin route not found.
        </div>
      );
    };

    return (
      <AdminLayout
        currentUser={currentUser}
        currentPath={currentPath}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        {renderAdminContent()}

        {/* Staff Manual Enquiry Modal */}
        <ManualEnquiryModal
          isOpen={manualEnquiryOpen}
          onClose={() => setManualEnquiryOpen(false)}
          onSuccess={() => {
            alert('Lead saved into enquiry inbox and queued for AI extraction.');
            navigate('/admin/enquiries');
          }}
        />
      </AdminLayout>
    );
  }

  // --------------------------------------------------------------------------
  // PUBLIC CLIENT ROUTING
  // --------------------------------------------------------------------------

  const renderPublicPage = () => {
    // 1. Home View
    if (currentPath === '/' || currentPath === '' || currentPath.startsWith('/#')) {
      return (
        <HomeView
          destinations={destinations}
          packages={publishedPackages}
          onNavigate={navigate}
          onOpenEnquiry={handleOpenEnquiry}
        />
      );
    }

    // 2. Destination View
    if (currentPath.startsWith('/destinations/')) {
      const slug = currentPath.replace('/destinations/', '').split('?')[0];
      return (
        <DestinationView
          slug={slug}
          onNavigate={navigate}
          onOpenEnquiry={handleOpenEnquiry}
        />
      );
    }

    // 3. Draft Preview View (/packages/preview/:id?token=...)
    if (currentPath.startsWith('/packages/preview/')) {
      return <PreviewPackageLoader currentPath={currentPath} onNavigate={navigate} onOpenEnquiry={handleOpenEnquiry} />;
    }

    // 4. Package Detail View (/packages/:slug)
    if (currentPath.startsWith('/packages/')) {
      const slug = currentPath.replace('/packages/', '').split('?')[0];
      return <PublicPackageLoader slug={slug} onNavigate={navigate} onOpenEnquiry={handleOpenEnquiry} />;
    }

    // 5. Search View
    if (currentPath.startsWith('/search')) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      return (
        <SearchView
          initialQuery={q}
          onNavigate={navigate}
          onOpenEnquiry={handleOpenEnquiry}
        />
      );
    }

    // 6. Privacy Notice (DPDP Act 2023)
    if (currentPath === '/privacy') {
      return <PrivacyView onNavigate={navigate} />;
    }

    // 7. Branded Official Quotation View (/quote/:reference or /quotes/:reference)
    if (currentPath.startsWith('/quote/') || currentPath.startsWith('/quotes/')) {
      const ref = currentPath.replace(/^\/quotes?\//, '').split('?')[0];
      return <QuoteDetailView reference={ref} onNavigate={navigate} />;
    }

    // 8. Travel Journal / Blog List (/journal or /blogs)
    if (currentPath === '/journal' || currentPath === '/blogs') {
      return <BlogListView onNavigate={navigate} onOpenEnquiry={handleOpenEnquiry} />;
    }

    // 9. Travel Journal Post (/journal/:slug or /blog/:slug)
    if (currentPath.startsWith('/journal/') || currentPath.startsWith('/blog/')) {
      const slug = currentPath.replace(/^\/(journal|blogs?)\//, '').split('?')[0];
      return <BlogPostView slug={slug} onNavigate={navigate} onOpenEnquiry={handleOpenEnquiry} />;
    }

    // 404 Fallback
    return (
      <div className="max-w-2xl mx-auto py-28 text-center space-y-4 px-4">
        <h1 className="text-3xl font-serif font-bold text-[#122428]">404 · Circuit Not Found</h1>
        <p className="text-xs text-stone-600">
          The holiday itinerary you requested does not exist or has been archived.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-[#122428] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
        >
          Return to Curated Journeys
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBF9]">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenEnquiry={handleOpenEnquiry}
      />

      <main className="flex-1">{renderPublicPage()}</main>

      <Footer onNavigate={navigate} />

      {/* Global Enquiry Drawer */}
      <EnquiryDrawer
        isOpen={enquiryDrawerOpen}
        onClose={() => setEnquiryDrawerOpen(false)}
        initialPackageId={enquiryPackage?.id}
        initialPackageTitle={enquiryPackage?.snapshot?.title}
        initialPackageCode={enquiryPackage?.code}
      />
    </div>
  );
}

// Helper component for loading public published package
function PublicPackageLoader({
  slug,
  onNavigate,
  onOpenEnquiry,
}: {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/packages/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Package not found or currently un-published.');
        return res.json();
      })
      .then((resData) => setData(resData.package))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="py-24 text-center text-xs text-stone-500 animate-pulse">Loading itinerary and certified tariffs...</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-4 px-4">
        <h1 className="text-2xl font-serif font-bold text-[#122428]">Itinerary Not Available</h1>
        <p className="text-xs text-stone-600">{error || 'This package is not currently published.'}</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 bg-[#122428] text-white text-xs font-semibold rounded-lg"
        >
          Return to All Journeys
        </button>
      </div>
    );
  }

  return <PackageDetailView packageData={data} onNavigate={onNavigate} onOpenEnquiry={onOpenEnquiry} />;
}

// Helper component for loading signed draft preview
function PreviewPackageLoader({
  currentPath,
  onNavigate,
  onOpenEnquiry,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const searchPart = window.location.search;
    const pkgId = currentPath.replace('/packages/preview/', '').split('?')[0];

    fetch(`/api/packages/preview/${pkgId}${searchPart}`)
      .then((res) => {
        if (!res.ok) throw new Error('Preview authorization token invalid or expired.');
        return res.json();
      })
      .then((resData) => setData(resData.package))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentPath]);

  if (loading) {
    return <div className="py-24 text-center text-xs text-stone-500 animate-pulse">Verifying preview signature...</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-4 px-4">
        <h1 className="text-2xl font-serif font-bold text-red-700">Preview Token Invalid</h1>
        <p className="text-xs text-stone-600">{error}</p>
        <button
          onClick={() => onNavigate('/admin/packages')}
          className="px-4 py-2 bg-[#122428] text-white text-xs font-semibold rounded-lg"
        >
          Return to Package CMS
        </button>
      </div>
    );
  }

  return <PackageDetailView packageData={data} onNavigate={onNavigate} onOpenEnquiry={onOpenEnquiry} />;
}
