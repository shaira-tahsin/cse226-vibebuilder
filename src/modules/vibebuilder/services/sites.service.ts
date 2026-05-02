import { graphqlClient } from '@/lib/graphql-client';
import {
  GetSitesResponse,
  InsertSiteResponse,
  InsertSiteParams,
  UpdateSiteResponse,
  UpdateSiteParams,
  DeleteSiteResponse,
  VibePage,
} from '../types/site.types';
import { GET_SITES_QUERY } from '../graphql/queries';
import {
  INSERT_SITE_MUTATION,
  UPDATE_SITE_MUTATION,
  DELETE_SITE_MUTATION,
} from '../graphql/mutations';

export const getSites = async (context: {
  queryKey: [string, { pageNo: number; pageSize: number; ownerId: string }];
}) => {
  const [, { pageNo, pageSize, ownerId }] = context.queryKey;
  return graphqlClient.query<GetSitesResponse>({
    query: GET_SITES_QUERY,
    variables: {
      input: {
        filter: JSON.stringify({ OwnerId: ownerId }),
        sort: '{}',
        pageNo,
        pageSize,
      },
    },
  });
};

export const insertSite = async (params: InsertSiteParams): Promise<InsertSiteResponse> => {
  return graphqlClient.mutate<InsertSiteResponse>({
    query: INSERT_SITE_MUTATION,
    variables: params,
  });
};

export const updateSite = async (params: UpdateSiteParams): Promise<UpdateSiteResponse> => {
  return graphqlClient.mutate<UpdateSiteResponse>({
    query: UPDATE_SITE_MUTATION,
    variables: params,
  });
};

export const updateSitePages = async (
  siteId: string,
  pages: VibePage[]
): Promise<UpdateSiteResponse> => {
  return graphqlClient.mutate<UpdateSiteResponse>({
    query: UPDATE_SITE_MUTATION,
    variables: {
      filter: JSON.stringify({ ItemId: siteId }),
      input: { Pages: JSON.stringify(pages) },
    },
  });
};

export const deleteSite = async (siteId: string): Promise<DeleteSiteResponse> => {
  return graphqlClient.mutate<DeleteSiteResponse>({
    query: DELETE_SITE_MUTATION,
    variables: {
      filter: JSON.stringify({ ItemId: siteId }),
      input: { isHardDelete: true },
    },
  });
};

export const uploadImage = async (file: File): Promise<string> => {
  const { getPreSignedUrlForUpload } = await import('@/lib/api/services/storage.service');
  const presigned = await getPreSignedUrlForUpload({
    name: file.name,
    projectKey: import.meta.env.VITE_X_BLOCKS_KEY,
    moduleName: 1,
    tags: '',
    metaData: '{}',
    parentDirectoryId: '',
  });
  if (!presigned.isSuccess || !presigned.uploadUrl || !presigned.fileId) {
    throw new Error('Failed to get upload URL');
  }
  const putRes = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type || 'application/octet-stream',
    },
  });
  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Upload failed: ${putRes.status} ${errText}`);
  }

  // Return a direct view URL using the known Blocks file serving pattern
  const blocksApiUrl = import.meta.env.VITE_BLOCKS_API_URL || 'https://api.seliseblocks.com';
  const blocksKey = import.meta.env.VITE_X_BLOCKS_KEY;
  const projectSlug = import.meta.env.VITE_PROJECT_SLUG;
  const urlRes = await fetch(
    `${blocksApiUrl}/uds/v1/${projectSlug}/Files/GetFileUrl/${presigned.fileId}`,
    { headers: { 'x-blocks-key': blocksKey } }
  );
  if (urlRes.ok) {
    const urlData = await urlRes.json();
    if (urlData?.isSuccess && urlData?.url) {
      return urlData.url;
    }
    if (urlData?.url) return urlData.url;
  }
  // Fallback: construct direct blob URL from the upload URL base
  const uploadBase = presigned.uploadUrl?.split('?')[0];
  if (uploadBase) return uploadBase;
  return presigned.fileId;
};
