import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/state/store/auth';
import {
  getSites,
  insertSite,
  updateSite,
  deleteSite,
  updateSitePages,
} from '../services/sites.service';
import { VibePage, UpdateSiteParams } from '../types/site.types';

const SITES_KEY = 'vibe-sites';

export const useSites = () => {
  const user = useAuthStore((s) => s.user);
  const ownerId = user?.itemId ?? '';
  return useQuery({
    queryKey: [SITES_KEY, { pageNo: 1, pageSize: 50, ownerId }],
    queryFn: getSites,
    enabled: !!ownerId,
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (params: { name: string; slug: string; theme?: string }) =>
      insertSite({
        input: {
          OwnerId: user?.itemId ?? '',
          Name: params.name,
          Slug: params.slug,
          IsPublished: false,
          Theme: params.theme ?? 'classic',
          Pages: JSON.stringify([
            {
              PageId: crypto.randomUUID(),
              Name: 'Home',
              Slug: 'home',
              Order: 0,
              Components: [],
            },
          ]),
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SITES_KEY] }),
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) => deleteSite(siteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SITES_KEY] }),
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateSiteParams) => updateSite(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SITES_KEY] }),
  });
};

export const useUpdatePages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, pages }: { siteId: string; pages: VibePage[] }) =>
      updateSitePages(siteId, pages),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SITES_KEY] }),
  });
};
