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

  return (
    <div className="fixed inset-0 overflow-y-auto bg-background z-50">
      {pages.length > 1 && (
        <nav className="border-b bg-card px-6 py-3 flex items-center gap-1">
          <span className="font-semibold mr-4 text-sm">{site.Name}</span>
          {pages.map((pg) => (
            <Link
              key={pg.PageId}
              to={`/site/${siteId}/${pg.Slug}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                pg.PageId === currentPage.PageId
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {pg.Name}
            </Link>
          ))}
        </nav>
      )}
      <div>
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
