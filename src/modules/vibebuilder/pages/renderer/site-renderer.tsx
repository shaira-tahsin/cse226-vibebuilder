import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { graphqlClient } from '@/lib/graphql-client';
import { GET_SITES_QUERY } from '../../graphql/queries';
import { GetSitesResponse, VibeSite, VibePage } from '../../types/site.types';
import { renderComponent } from '../../components/vibe-components/vibe-components';

export const SiteRendererPage = () => {
  const { siteId, pageSlug } = useParams<{ siteId: string; pageSlug: string }>();
  const [site, setSite] = useState<VibeSite | null>(null);
  const [pages, setPages] = useState<VibePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await graphqlClient.query<GetSitesResponse>({
          query: GET_SITES_QUERY,
          variables: {
            input: {
              pageNo: 1,
              pageSize: 1,
              filter: JSON.stringify({ ItemId: siteId }),
            },
          },
        });
        const found = res?.getVibeSites?.items?.[0];
        if (!found || !found.IsPublished) {
          setNotFound(true);
          return;
        }
        setSite(found);
        const parsed: VibePage[] = (() => {
          try {
            return JSON.parse(found.Pages || '[]');
          } catch {
            return [];
          }
        })();
        setPages(parsed);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Site not found</h1>
        <p className="text-muted-foreground">This site may not be published or does not exist.</p>
      </div>
    );
  }

  const currentPage = pages.find((p) => p.Slug === pageSlug) || pages[0];

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Page not found</p>
      </div>
    );
  }

  const siteSlug = site.Slug;

  const theme = (site.Theme ?? 'classic') as string;

  const navStyles: Record<string, { nav: string; siteName: string; active: string; inactive: string; pageBg: string }> = {
    classic:  { nav: 'border-b bg-white',      siteName: 'text-slate-800',   active: 'bg-blue-600 text-white',     inactive: 'text-slate-600 hover:bg-slate-100',   pageBg: 'bg-white' },
    spring:   { nav: 'border-b bg-pink-50',    siteName: 'text-pink-800',    active: 'bg-pink-400 text-white',     inactive: 'text-pink-600 hover:bg-pink-100',     pageBg: 'bg-white' },
    ash:      { nav: 'border-b bg-slate-100',  siteName: 'text-slate-700',   active: 'bg-slate-500 text-white',    inactive: 'text-slate-500 hover:bg-slate-200',   pageBg: 'bg-white' },
    autumn:   { nav: 'border-b bg-amber-50',   siteName: 'text-amber-900',   active: 'bg-amber-800 text-white',    inactive: 'text-amber-700 hover:bg-amber-100',   pageBg: 'bg-white' },
    garden:   { nav: 'border-b bg-emerald-50', siteName: 'text-emerald-900', active: 'bg-emerald-600 text-white',  inactive: 'text-emerald-700 hover:bg-emerald-100', pageBg: 'bg-white' },
    midnight: { nav: 'bg-slate-900',           siteName: 'text-white',       active: 'bg-slate-600 text-white',    inactive: 'text-slate-300 hover:bg-slate-700',   pageBg: 'bg-slate-900' },
  };

  const navStyle = navStyles[theme] ?? navStyles['classic'];

  return (
    <div className={`fixed inset-0 overflow-y-auto z-50 ${navStyle.pageBg}`}>
      {pages.length > 1 && (
        <nav className={`px-6 py-3 flex items-center gap-1 ${navStyle.nav}`}>
          <span className={`font-semibold mr-4 text-sm ${navStyle.siteName}`}>{site.Name}</span>
          {pages.map((pg) => (
            <Link
              key={pg.PageId}
              to={`/site/${siteId}/${pg.Slug}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                pg.PageId === currentPage.PageId
                  ? navStyle.active
                  : navStyle.inactive
              }`}
            >
              {pg.Name}
            </Link>
          ))}
        </nav>
      )}
      <div style={theme === 'midnight' ? { color: '#f1f5f9' } : {}}>
        {currentPage.Components.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            This page has no content yet.
          </div>
        ) : (
          [...currentPage.Components]
            .sort((a, b) => a.Order - b.Order)
            .map((comp) => renderComponent(comp, siteId, siteSlug))
        )}
      </div>
    </div>
  );
};
