import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Globe,
  Trash2,
  ExternalLink,
  Loader2,
  LayoutGrid,
  List,
  Search,
  Layers,
  LogOut,
  Zap,
  MoreHorizontal,
  Eye,
  Edit3,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { useSites, useCreateSite, useDeleteSite } from '../../hooks/use-sites';
import { VibeSite } from '../../types/site.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui-kit/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui-kit/alert-dialog';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { toast } from 'sonner';
import { useAuthStore } from '@/state/store/auth';
import { graphqlClient } from '@/lib/graphql-client';

type LayoutMode = 'grid' | 'list';
type VisibilityFilter = 'all' | 'published' | 'draft';
type NavSection = 'sites' | 'responses';
type VibeTheme = 'classic' | 'spring' | 'ash' | 'autumn' | 'garden' | 'midnight';

const THEMES: { id: VibeTheme; label: string; preview: string; description: string }[] = [
  { id: 'classic', label: 'Classic', preview: 'bg-blue-600', description: 'Clean blue' },
  { id: 'spring', label: 'Spring', preview: 'bg-pink-400', description: 'Soft pink' },
  { id: 'ash', label: 'Ash', preview: 'bg-slate-500', description: 'Cool grey' },
  { id: 'autumn', label: 'Autumn', preview: 'bg-amber-800', description: 'Warm maroon' },
  { id: 'garden', label: 'Garden', preview: 'bg-emerald-600', description: 'Fresh green' },
  { id: 'midnight', label: 'Midnight', preview: 'bg-slate-900', description: 'Dark mode' },
];

export const VibeDashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useSites();
  const createSite = useCreateSite();
  const deleteSite = useDeleteSite();
  const { user, logout } = useAuthStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VibeSite | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [layout, setLayout] = useState<LayoutMode>(() => {
    return (localStorage.getItem('vibe-layout') as LayoutMode) || 'grid';
  });

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayout(mode);
    localStorage.setItem('vibe-layout', mode);
  };
  const [visibility, setVisibility] = useState<VisibilityFilter>('all');
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState<NavSection>('sites');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<VibeTheme>('classic');

  const allSites: VibeSite[] = data?.getVibeSites?.items ?? [];

  const filteredSites = allSites.filter((site) => {
    const matchesSearch =
      site.Name.toLowerCase().includes(search.toLowerCase()) ||
      site.Slug.toLowerCase().includes(search.toLowerCase());
    const matchesVisibility =
      visibility === 'all' ||
      (visibility === 'published' && site.IsPublished) ||
      (visibility === 'draft' && !site.IsPublished);
    return matchesSearch && matchesVisibility;
  });

  const publishedCount = allSites.filter((s) => s.IsPublished).length;
  const draftCount = allSites.filter((s) => !s.IsPublished).length;

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;
    try {
      await createSite.mutateAsync({ name: name.trim(), slug: slug.trim(), theme });
      toast.success('Site created!');
      setCreateOpen(false);
      setName('');
      setSlug('');
      setTheme('classic');
    } catch {
      toast.error('Failed to create site');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSite.mutateAsync(deleteTarget.ItemId);
      toast.success('Site deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete site');
    }
  };

  const userInitial = user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U';
  const userDisplay = user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user?.email ?? 'User';

  const navItems = [
    { id: 'sites' as NavSection, label: 'My Projects', icon: Layers },
    { id: 'responses' as NavSection, label: 'Responses', icon: MessageSquare },
  ];

  return (
    <div className="fixed inset-0 flex bg-[#f0f4f8] font-sans overflow-hidden z-0">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-[15px] tracking-tight">VibeBuilder</span>
          </div>
        </div>

        {/* New Site CTA */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Site
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeNav === id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Stats pills */}
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Overview</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total Sites</span>
              <span className="text-xs font-semibold text-slate-700">{allSites.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Published</span>
              <span className="text-xs font-semibold text-emerald-600">{publishedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Drafts</span>
              <span className="text-xs font-semibold text-amber-500">{draftCount}</span>
            </div>
          </div>
        </div>

      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — title changes per section */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {activeNav === 'sites' && 'My Projects'}
              {activeNav === 'responses' && 'Responses'}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {activeNav === 'sites' && 'Build and publish websites visually'}
              {activeNav === 'responses' && 'Form submissions from your sites'}
            </p>
          </div>
          <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setProfileOpen(false); }}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={userDisplay} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {userInitial}
                  </div>
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-slate-700 truncate">{userDisplay}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email ?? ''}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700 truncate">{userDisplay}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email ?? ''}</p>
                </div>
                <button
                  onClick={() => { logout?.(); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Responses section */}
        {activeNav === 'responses' && (
          <ResponsesSection allSites={allSites} />
        )}

        {/* Sites section */}
        {activeNav === 'sites' && (<>
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
          </div>

          {/* Visibility filter */}
          <div className="relative">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityFilter)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer transition"
            >
              <option value="all">All Sites</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => handleLayoutChange('grid')}
              className={`p-1.5 rounded-md transition-colors ${layout === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleLayoutChange('list')}
              className={`p-1.5 rounded-md transition-colors ${layout === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                <p className="text-sm text-slate-400">Loading your sites...</p>
              </div>
            </div>
          ) : filteredSites.length === 0 ? (
            <EmptyState
              hasSearch={!!search || visibility !== 'all'}
              onCreate={() => setCreateOpen(true)}
            />
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredSites.map((site) => (
                <SiteCard
                  key={site.ItemId}
                  site={site}
                  onEdit={() => navigate(`/editor/${site.ItemId}`)}
                  onDelete={() => setDeleteTarget(site)}
                  onView={() => navigate(`/site/${site.ItemId}/home`)}
                  showDropdown={showDropdown === site.ItemId}
                  onToggleDropdown={() =>
                    setShowDropdown(showDropdown === site.ItemId ? null : site.ItemId)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSites.map((site) => (
                <SiteRow
                  key={site.ItemId}
                  site={site}
                  onEdit={() => navigate(`/editor/${site.ItemId}`)}
                  onDelete={() => setDeleteTarget(site)}
                  onView={() => navigate(`/site/${site.ItemId}/home`)}
                />
              ))}
            </div>
          )}
        </div>
        </>)}
      </main>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Create New Site</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Site Name</Label>
              <Input
                placeholder="My Awesome Site"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">URL Slug</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 shrink-0">/site/</span>
                <Input
                  placeholder="my-awesome-site"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-400">Used in the public URL of your site</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                      theme === t.id
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full shrink-0 ${t.preview}`} />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{t.label}</p>
                      <p className="text-[10px] text-slate-400">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || !slug.trim() || createSite.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createSite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.Name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the site and all its pages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ── Empty State ── */
const EmptyState = ({ hasSearch, onCreate }: { hasSearch: boolean; onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
      <Globe className="w-8 h-8 text-blue-400" />
    </div>
    <p className="text-slate-700 font-semibold text-base">
      {hasSearch ? 'No sites match your filters' : 'No sites yet'}
    </p>
    <p className="text-sm text-slate-400 mt-1 mb-4">
      {hasSearch ? 'Try adjusting your search or filter' : 'Create your first site to get started'}
    </p>
    {!hasSearch && (
      <button
        onClick={onCreate}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Site
      </button>
    )}
  </div>
);

/* ── Site Card (Grid) ── */
// Returns a relative time string e.g. "2 hours ago", "3 days ago"
const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SiteCard = ({
  site,
  onEdit,
  onDelete,
  onView,
  showDropdown,
  onToggleDropdown,
}: {
  site: VibeSite;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}) => {
  const pages = (() => {
    try { return JSON.parse(site.Pages ?? '[]'); } catch { return []; }
  })();

  // Extract hero image from the first page's first hero component
  const heroImageUrl: string | null = (() => {
    const firstPage = pages[0];
    if (!firstPage?.Components) return null;
    const hero = firstPage.Components.find((c: any) => c.Type === 'hero');
    return (hero?.Props?.imageUrl as string) || null;
  })();

  // Extract hero bg color as fallback
  const heroBgColor: string = (() => {
    const firstPage = pages[0];
    if (!firstPage?.Components) return '#1e293b';
    const hero = firstPage.Components.find((c: any) => c.Type === 'hero');
    return (hero?.Props?.bgColor as string) || '#1e293b';
  })();

  const editedAgo = site.LastUpdatedDate ? timeAgo(site.LastUpdatedDate) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-visible hover:shadow-md hover:border-slate-300 transition-all group">
      {/* Thumbnail area */}
      <div
        className="h-36 cursor-pointer relative overflow-hidden rounded-t-xl"
        style={heroImageUrl
          ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: heroBgColor }
        }
        onClick={onEdit}
      >
        {/* Dimming overlay so slug text is readable when no image */}
        {!heroImageUrl && (
          <div className="absolute inset-0 bg-black/20" />
        )}
        {/* Slug label */}
        <div className="absolute bottom-2 left-3">
          <span className="text-[11px] text-white/80 font-medium bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
            /{site.Slug}
          </span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1.5 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          {site.IsPublished && (
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/30 transition"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 flex items-center gap-3 bg-white rounded-b-xl border-t border-slate-100">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{site.Name}</p>
          <p className="text-xs text-slate-400">
            {pages.length} page{pages.length !== 1 ? 's' : ''}
            {editedAgo ? ` · edited ${editedAgo}` : ''}
          </p>
        </div>

        {/* Status + menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            site.IsPublished
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {site.IsPublished ? 'Live' : 'Draft'}
          </span>

          <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onToggleDropdown(); }}>
            <button
              onClick={onToggleDropdown}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                <button
                  onClick={() => { onEdit(); onToggleDropdown(); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                {site.IsPublished && (
                  <button
                    onClick={() => { onView(); onToggleDropdown(); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Live
                  </button>
                )}
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => { onDelete(); onToggleDropdown(); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Site Row (List) ── */
const SiteRow = ({
  site,
  onEdit,
  onDelete,
  onView,
}: {
  site: VibeSite;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const pages = (() => {
    try { return JSON.parse(site.Pages ?? '[]'); } catch { return []; }
  })();

  const editedAgo = site.LastUpdatedDate ? timeAgo(site.LastUpdatedDate) : '—';

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{site.Name}</p>
        <p className="text-xs text-slate-400">/{site.Slug}</p>
      </div>

      <div className="hidden sm:flex items-center gap-6 text-xs text-slate-500 shrink-0">
        <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
        <span>Edited {editedAgo}</span>
      </div>

      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${
        site.IsPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
      }`}>
        {site.IsPublished ? 'Live' : 'Draft'}
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
        {site.IsPublished && (
          <button
            onClick={onView}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ── Responses Section ── */
const GET_SUBMISSIONS_QUERY = `
  query GetVibeFormSubmissions($input: QueryInput) {
    getVibeFormSubmissions(input: $input) {
      items {
        ItemId
        SiteId
        SiteSlug
        Name
        Email
        Message
        SubmittedAt
      }
      totalCount
    }
  }
`;

const ResponsesSection = ({ allSites }: { allSites: VibeSite[] }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await graphqlClient.query<any>({
          query: GET_SUBMISSIONS_QUERY,
          variables: { input: { pageNo: 1, pageSize: 100 } },
        });
        setSubmissions(res?.getVibeFormSubmissions?.items ?? []);
      } catch {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = selectedSite === 'all'
    ? submissions
    : submissions.filter((s) => s.SiteId === selectedSite);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      {/* Site filter */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer transition"
          >
            <option value="all">All Sites</option>
            {allSites.map((s) => (
              <option key={s.ItemId} value={s.ItemId}>{s.Name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} response{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-slate-700 font-semibold">No responses yet</p>
          <p className="text-sm text-slate-400 mt-1">Responses from your contact forms will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((sub) => (
            <div key={sub.ItemId} className="bg-white border border-slate-200 rounded-xl px-5 py-4 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{sub.Name}</p>
                    <span className="text-xs text-slate-400">·</span>
                    <p className="text-xs text-slate-500">{sub.Email}</p>
                    {sub.SiteSlug && (
                      <>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-blue-500 font-medium">/{sub.SiteSlug}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{sub.Message}</p>
                </div>
                <p className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                  {sub.SubmittedAt ? new Date(sub.SubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
