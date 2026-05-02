import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuid } from 'uuid';
import {
  ArrowLeft,
  Globe,
  GlobeLock,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  CheckCircle2,
  LayoutTemplate,
  Type,
  Image,
  Images,
  Mail,
  Minus,
  MoveVertical,
  Columns2,
  MousePointerClick,
  ExternalLink,
  Eye,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { useSites, useUpdateSite, useUpdatePages } from '../../hooks/use-sites';
import { VibeSite, VibePage, VibeComponent } from '../../types/site.types';
import { PropertyPanel } from '../../components/property-panel/property-panel';
import { renderComponent } from '../../components/vibe-components/vibe-components';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui-kit/dialog';
import { toast } from 'sonner';

// ─── Default props per component type ────────────────────────────────────────
const defaultProps: Record<string, Record<string, unknown>> = {
  hero: {
    heading: 'Welcome to My Site',
    subheading: 'A beautiful website built with VibeBuilder',
    bgColor: '#1e293b',
    textColor: '#ffffff',
    ctaText: 'Get Started',
    ctaLink: '#',
    imageYPercent: 50,
  },
  'text-block': {
    content: 'Start writing your content here...',
    fontSize: '16px',
    textAlign: 'left',
  },
  image: { imageUrl: '', alt: 'Image', width: '100%', caption: '' },
  'image-gallery': { images: [], columns: 3, gap: 12 },
  'contact-form': {
    fields: [
      { label: 'Name', type: 'text', required: true },
      { label: 'Email', type: 'email', required: true },
      { label: 'Message', type: 'textarea', required: false },
    ],
    submitText: 'Send Message',
  },
  divider: { color: '#e2e8f0', thickness: 1, margin: 16 },
  button: { text: 'Click Me', link: '#', bgColor: '#1e293b', textColor: '#ffffff', size: 'md', align: 'center', rounded: 'md' },
  'two-column': { leftWidth: 50, gap: 16, padding: 16, bgColor: 'transparent' },
  spacer: { height: 40 },
  heading: { text: 'Section Title', level: 'h2', color: '#0f172a', textAlign: 'left', fontFamily: 'inherit' },
};

// ─── Component library definition ────────────────────────────────────────────
const COMPONENT_LIBRARY = [
  {
    type: 'hero',
    label: 'Hero Section',
    description: 'Full-width banner with CTA',
    icon: LayoutTemplate,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    type: 'text-block',
    label: 'Text Block',
    description: 'Paragraph or heading text',
    icon: Type,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    type: 'heading',
    label: 'Heading',
    description: 'H1, H2, or H3 title',
    icon: Type,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Single image with caption',
    icon: Image,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    type: 'image-gallery',
    label: 'Image Gallery',
    description: 'Grid of multiple images',
    icon: Images,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    type: 'contact-form',
    label: 'Contact Form',
    description: 'Name, email & message fields',
    icon: Mail,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal rule separator',
    icon: Minus,
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
  },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Add vertical whitespace',
    icon: MoveVertical,
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
  },
  {
    type: 'button',
    label: 'Button',
    description: 'Standalone call-to-action',
    icon: MousePointerClick,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    type: 'two-column',
    label: 'Two Columns',
    description: 'Side-by-side layout',
    icon: Columns2,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

// ─── Type label map ───────────────────────────────────────────────────────────
const typeLabel: Record<string, string> = {
  hero: 'Hero Section',
  'text-block': 'Text Block',
  image: 'Image',
  'image-gallery': 'Image Gallery',
  'contact-form': 'Contact Form',
  divider: 'Divider',
  spacer: 'Spacer',
  button: 'Button',
  'two-column': 'Two Columns',
  heading: 'Heading',
};

const typeIcon: Record<string, React.ElementType> = {
  hero: LayoutTemplate,
  'text-block': Type,
  image: Image,
  'image-gallery': Images,
  'contact-form': Mail,
  divider: Minus,
  spacer: MoveVertical,
  button: MousePointerClick,
  'two-column': Columns2,
  heading: Type,
};

// ─── Theme definitions ───────────────────────────────────────────────────────
type VibeTheme = 'classic' | 'spring' | 'ash' | 'autumn' | 'garden' | 'midnight';

const THEMES: { id: VibeTheme; label: string; preview: string }[] = [
  { id: 'classic',  label: 'Classic',  preview: 'bg-blue-600' },
  { id: 'spring',   label: 'Spring',   preview: 'bg-pink-400' },
  { id: 'ash',      label: 'Ash',      preview: 'bg-slate-500' },
  { id: 'autumn',   label: 'Autumn',   preview: 'bg-amber-800' },
  { id: 'garden',   label: 'Garden',   preview: 'bg-emerald-600' },
  { id: 'midnight', label: 'Midnight', preview: 'bg-slate-900' },
];

const THEME_TAB_ACTIVE: Record<string, string> = {
  classic:  'bg-blue-600 text-white border-blue-600',
  spring:   'bg-pink-400 text-white border-pink-400',
  ash:      'bg-slate-500 text-white border-slate-500',
  autumn:   'bg-amber-800 text-white border-amber-800',
  garden:   'bg-emerald-600 text-white border-emerald-600',
  midnight: 'bg-slate-900 text-white border-slate-900',
};

// ─── Sortable canvas item ─────────────────────────────────────────────────────
const SortableItem = ({
  component,
  isSelected,
  onSelect,
  onDelete,
  onComponentChange,
  onNestedSelect,
  onColumnAdd,
  selectedColumn,
}: {
  component: VibeComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onComponentChange: (updated: VibeComponent) => void;
  onNestedSelect: (parentId: string, side: 'left' | 'right', componentId: string) => void;
  onColumnAdd: (parentId: string, side: 'left' | 'right') => void;
  selectedColumn: { parentId: string; side: 'left' | 'right' } | null;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.Id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const Icon = typeIcon[component.Type] || LayoutTemplate;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        // Don't steal click from column slot placeholders
        if ((e.target as HTMLElement).closest('[data-column-slot]')) return;
        onSelect();
      }}
      className={`relative group rounded-xl cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-md'
          : 'ring-1 ring-transparent hover:ring-slate-200 hover:shadow-sm'
      }`}
    >
      {/* Top bar — always in normal flow, so it never overlaps component content */}
      <div
        className={`flex items-center justify-between px-2 rounded-t-xl transition-all duration-150 overflow-hidden ${
          isSelected
            ? 'bg-blue-600 text-white py-1'
            : 'bg-white/95 backdrop-blur-sm border-b border-slate-200 opacity-0 group-hover:opacity-100 py-1'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <Icon className="w-3 h-3" />
          <span className="text-xs font-medium">{typeLabel[component.Type] || component.Type}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`p-0.5 rounded transition-colors ${
            isSelected
              ? 'hover:bg-white/20 text-white'
              : 'hover:bg-red-50 hover:text-red-500 text-slate-400'
          }`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Component preview */}
      <div className="rounded-b-xl overflow-hidden">
        {renderComponent(
          component,
          true,
          onComponentChange,
          onNestedSelect,
          onColumnAdd,
          selectedColumn?.parentId === component.Id ? selectedColumn.side : null,
          () => setSelectedColumn(null)
        )}
      </div>
    </div>
  );
};

// ─── Empty canvas placeholder ─────────────────────────────────────────────────
const EmptyCanvas = () => (
  <div className="flex flex-col items-center justify-center h-72 mx-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white gap-3">
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <LayoutTemplate className="w-6 h-6 text-blue-400" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-slate-700">Your canvas is empty</p>
      <p className="text-xs text-slate-400 mt-1">
        Click any component on the left panel to add it here
      </p>
    </div>
    <div className="flex items-center gap-1 text-xs text-slate-300">
      <ChevronRight className="w-3 h-3 -rotate-180" />
      <span>Select from the left sidebar</span>
    </div>
  </div>
);

// ─── Main Editor ──────────────────────────────────────────────────────────────
export const EditorPage = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useSites();
  const updateSite = useUpdateSite();
  const updatePages = useUpdatePages();

  const [site, setSite] = useState<VibeSite | null>(null);
  const [pages, setPages] = useState<VibePage[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  // For nested components inside two-column: track parent ID and side
  const [selectedColumn, setSelectedColumn] = useState<{
    parentId: string;
    side: 'left' | 'right';
  } | null>(null);
  const [selectedNested, setSelectedNested] = useState<{
    parentId: string;
    side: 'left' | 'right';
    componentId: string;
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [siteTheme, setSiteTheme] = useState<VibeTheme>('classic');
  const [newPageName, setNewPageName] = useState('');

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Load site from query cache — only on initial load, not on every refetch
  useEffect(() => {
    if (!data || !siteId || hasLoaded.current) return;
    const found = data.getVibeSites?.items?.find((s) => s.ItemId === siteId);
    if (found) {
      hasLoaded.current = true;
      setSite(found);
      setSiteTheme((found.Theme as VibeTheme) ?? 'classic');
      const parsed: VibePage[] = (() => {
        try {
          return JSON.parse(found.Pages || '[]');
        } catch {
          return [];
        }
      })();
      setPages(parsed);
      if (parsed.length > 0) setCurrentPageId(parsed[0].PageId);
    }
  }, [data, siteId]);

  const currentPage = pages.find((p) => p.PageId === currentPageId);
  const components = currentPage?.Components ?? [];

  // Auto-save with debounce
  const scheduleSave = useCallback(
    (updatedPages: VibePage[]) => {
      if (!siteId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      setSavedRecently(false);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await updatePages.mutateAsync({ siteId, pages: updatedPages });
          setSavedRecently(true);
          savedTimer.current = setTimeout(() => setSavedRecently(false), 2500);
        } finally {
          setSaving(false);
        }
      }, 1200);
    },
    [siteId, updatePages]
  );

  const updateComponents = (updater: (comps: VibeComponent[]) => VibeComponent[]) => {
    setPages((prev) => {
      const next = prev.map((pg) =>
        pg.PageId === currentPageId ? { ...pg, Components: updater(pg.Components) } : pg
      );
      scheduleSave(next);
      return next;
    });
  };

  const addComponent = (type: string) => {
    const newComp: VibeComponent = {
      Id: uuid(),
      Type: type,
      Order: 0,
      Props: { ...(defaultProps[type] || {}) },
    };

    if (selectedColumn) {
      // Add into a two-column slot
      const { parentId, side } = selectedColumn;
      updateComponents((comps) =>
        comps.map((c) => {
          if (c.Id !== parentId) return c;
          if (side === 'left') {
            const newList = [...(c.LeftComponents || []), { ...newComp, Order: (c.LeftComponents || []).length }];
            return { ...c, LeftComponents: newList };
          } else {
            const newList = [...(c.RightComponents || []), { ...newComp, Order: (c.RightComponents || []).length }];
            return { ...c, RightComponents: newList };
          }
        })
      );
      // Select the new nested component for editing
      setSelectedNested({ parentId, side, componentId: newComp.Id });
      setSelectedComponentId(null);
    } else {
      updateComponents((comps) => [...comps, { ...newComp, Order: components.length }]);
      setSelectedComponentId(newComp.Id);
      setSelectedNested(null);
    }
  };

  const deleteComponent = (id: string) => {
    updateComponents((comps) => comps.filter((c) => c.Id !== id));
    if (selectedComponentId === id) setSelectedComponentId(null);
  };

  const handleComponentChange = (updated: VibeComponent) => {
    if (selectedNested && updated.Id === selectedNested.componentId) {
      // Update nested component inside a two-column parent
      updateComponents((comps) =>
        comps.map((c) => {
          if (c.Id !== selectedNested.parentId) return c;
          if (selectedNested.side === 'left') {
            return { ...c, LeftComponents: (c.LeftComponents || []).map((n) => n.Id === updated.Id ? updated : n) };
          } else {
            return { ...c, RightComponents: (c.RightComponents || []).map((n) => n.Id === updated.Id ? updated : n) };
          }
        })
      );
    } else {
      // Top-level component update (also handles two-column structure updates from TwoColumnComponent)
      updateComponents((comps) => comps.map((c) => (c.Id === updated.Id ? updated : c)));
    }
  };

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    updateComponents((comps) => {
      const oldIndex = comps.findIndex((c) => c.Id === active.id);
      const newIndex = comps.findIndex((c) => c.Id === over.id);
      return arrayMove(comps, oldIndex, newIndex).map((c, i) => ({ ...c, Order: i }));
    });
  };

  const togglePublish = async () => {
    if (!site || !siteId) return;
    try {
      await updateSite.mutateAsync({
        filter: JSON.stringify({ ItemId: siteId }),
        input: { IsPublished: !site.IsPublished },
      });
      setSite((s) => (s ? { ...s, IsPublished: !s.IsPublished } : s));
      toast.success(site.IsPublished ? 'Site unpublished' : 'Site published!');
    } catch {
      toast.error('Failed to update publish status');
    }
  };

  const handleThemeChange = async (newTheme: VibeTheme) => {
    if (!siteId) return;
    setSiteTheme(newTheme);
    setSite((s) => (s ? { ...s, Theme: newTheme } : s));
    try {
      await updateSite.mutateAsync({
        filter: JSON.stringify({ ItemId: siteId }),
        input: { Theme: newTheme } as any,
      });
      toast.success(`Theme changed to ${newTheme}`);
    } catch {
      toast.error('Failed to update theme');
    }
  };

  const handleAddPage = () => {
    if (!newPageName.trim()) return;
    const newPage: VibePage = {
      PageId: uuid(),
      Name: newPageName.trim(),
      Slug: newPageName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
      Order: pages.length,
      Components: [],
    };
    const next = [...pages, newPage];
    setPages(next);
    setCurrentPageId(newPage.PageId);
    setAddPageOpen(false);
    setNewPageName('');
    scheduleSave(next);
  };

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) {
      toast.error("Can't delete the only page");
      return;
    }
    const next = pages.filter((p) => p.PageId !== pageId);
    setPages(next);
    if (currentPageId === pageId) setCurrentPageId(next[0].PageId);
    scheduleSave(next);
  };

  // Resolve selected component — could be top-level or nested inside two-column
  const selectedComponent: VibeComponent | null = (() => {
    if (selectedNested) {
      const parent = components.find((c) => c.Id === selectedNested.parentId);
      if (!parent) return null;
      const list = selectedNested.side === 'left' ? parent.LeftComponents : parent.RightComponents;
      return list?.find((c) => c.Id === selectedNested.componentId) ?? null;
    }
    return components.find((c) => c.Id === selectedComponentId) ?? null;
  })();

  const activeComponent = components.find((c) => c.Id === activeId) ?? null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
          <GlobeLock className="w-6 h-6 text-red-400" />
        </div>
        <p className="font-medium">Site not found</p>
        <button
          onClick={() => navigate('/sites')}
          className="h-8 px-3 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#f0f4f8]">

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-slate-200 bg-white shrink-0 z-20">
        {/* Left: back + breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/sites')}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-100 transition-colors shrink-0 text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-slate-400 hidden sm:inline">Sites</span>
            <ChevronRight className="w-3 h-3 text-slate-300 hidden sm:inline shrink-0" />
            <span className="text-sm font-semibold text-slate-800 truncate">{site.Name}</span>
            <span className="text-xs text-slate-400 truncate hidden md:inline">
              /{site.Slug}
            </span>
          </div>
        </div>

        {/* Center: save status */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          {saving ? (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          ) : savedRecently ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {site.IsPublished && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs gap-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              onClick={() => window.open(`/site/${siteId}/${currentPage?.Slug || 'home'}`, '_blank')}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Button>
          )}
          <button
            className={`h-7 px-3 text-xs rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              site.IsPublished
                ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
            onClick={togglePublish}
            disabled={updateSite.isPending}
          >
            {updateSite.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : site.IsPublished ? (
              <><GlobeLock className="w-3.5 h-3.5" /> Unpublish</>
            ) : (
              <><Globe className="w-3.5 h-3.5" /> Publish</>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Three-Panel Layout ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Component Library ─────────────────────────────────────────── */}
        <aside className="w-56 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Components
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {COMPONENT_LIBRARY.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => addComponent(item.type)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className={`w-7 h-7 rounded-md ${item.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 leading-tight">{item.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight truncate">
                      {item.description}
                    </p>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER: Canvas ───────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-muted/20">

          {/* Page tabs */}
          <div className="flex items-center gap-0.5 px-3 pt-2 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
            {pages.map((pg) => (
              <div key={pg.PageId} className="flex items-center group shrink-0">
                <button
                  onClick={() => {
                    setCurrentPageId(pg.PageId);
                    setSelectedComponentId(null);
                    setSelectedNested(null);
                    setSelectedColumn(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-t-md transition-all ${
                    pg.PageId === currentPageId
                      ? (THEME_TAB_ACTIVE[siteTheme] ?? THEME_TAB_ACTIVE['classic'])
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pg.Name}
                </button>
                {pages.length > 1 && (
                  <button
                    onClick={() => deletePage(pg.PageId)}
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:text-red-500 transition-all -ml-1"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setAddPageOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors shrink-0 ml-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add page</span>
            </button>
          </div>

          {/* Drop canvas */}
          <div
            className={`flex-1 overflow-y-auto ${siteTheme === 'midnight' ? 'bg-slate-900' : ''}`}
            onClick={() => { setSelectedComponentId(null); setSelectedNested(null); setSelectedColumn(null); }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map((c) => c.Id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="my-6 space-y-2" style={siteTheme === 'midnight' ? { color: '#f1f5f9' } : {}}>
                  {components.length === 0 ? (
                    <EmptyCanvas />
                  ) : (
                    components.map((comp) => (
                      <SortableItem
                        key={comp.Id}
                        component={comp}
                        isSelected={comp.Id === selectedComponentId}
                        onSelect={() => { setSelectedComponentId(comp.Id); setSelectedNested(null); setSelectedColumn(null); }}
                        onDelete={() => deleteComponent(comp.Id)}
                        onComponentChange={handleComponentChange}
                        onNestedSelect={(parentId, side, componentId) => {
                          setSelectedNested({ parentId, side, componentId });
                          setSelectedColumn(null);
                          setSelectedComponentId(null);
                        }}
                        onColumnAdd={(parentId, side) => {
                          setSelectedColumn({ parentId, side });
                          setSelectedNested(null);
                          setSelectedComponentId(null);
                        }}
                        selectedColumn={selectedColumn}
                        onDeselect={() => setSelectedColumn(null)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activeComponent ? (
                  <div className="opacity-90 ring-2 ring-blue-500 rounded-xl shadow-2xl pointer-events-none">
                    {renderComponent(activeComponent)}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>

        {/* ── RIGHT: Property Panel ────────────────────────────────────────────── */}
        <aside
          className={`border-l border-slate-200 bg-white shrink-0 overflow-hidden transition-all duration-200 ${
            selectedComponent ? 'w-64' : 'w-56'
          }`}
        >
          {selectedComponent ? (
            <PropertyPanel
              component={selectedComponent}
              onChange={handleComponentChange}
              onClose={() => setSelectedComponentId(null)}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Properties
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    {selectedColumn ? (
                      <>
                        <p className="text-xs font-medium text-blue-600">Column selected</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Pick any component from the left sidebar to add it to this column
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-slate-700">No selection</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Click any component on the canvas to edit its properties
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Theme switcher */}
                <div className="px-3 pb-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Site Theme
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-all ${
                          siteTheme === t.id
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full shrink-0 ${t.preview}`} />
                        <span className="text-[11px] font-medium text-slate-700">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Page info footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Current Page
                </p>
                <p className="text-xs font-semibold text-slate-700 truncate">{currentPage?.Name || '—'}</p>
                <p className="text-[11px] text-slate-400">
                  {components.length} component{components.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Add Page Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Add New Page</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Input
              placeholder="e.g. About, Services, Contact"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
              className="h-9"
              autoFocus
            />
            {newPageName.trim() && (
              <p className="text-xs text-slate-400">
                URL slug:{' '}
                <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[11px]">
                  /
                  {newPageName
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')}
                </code>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button
              className="h-8 px-3 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
              onClick={() => setAddPageOpen(false)}
            >
              Cancel
            </button>
            <button
              className="h-8 px-3 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
              onClick={handleAddPage}
              disabled={!newPageName.trim()}
            >
              Add Page
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
