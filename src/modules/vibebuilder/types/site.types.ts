export interface VibeComponent {
  Id: string;
  Type: string;
  Order: number;
  Props: Record<string, unknown>;
  // Only used by 'two-column' type — left and right nested component lists
  LeftComponents?: VibeComponent[];
  RightComponents?: VibeComponent[];
}

export interface VibePage {
  PageId: string;
  Name: string;
  Slug: string;
  Order: number;
  Components: VibeComponent[];
}

export interface VibeSite {
  ItemId: string;
  OwnerId: string;
  Name: string;
  Slug: string;
  IsPublished: boolean;
  CreatedDate: string;
  LastUpdatedDate: string;
  Pages: string; // JSON stringified VibePage[]
}

export interface GetSitesResponse {
  getVibeSites: {
    items: VibeSite[];
    totalCount: number;
  };
}

export interface MutationResponse {
  itemId: string;
  totalImpactedData: number;
  acknowledged: boolean;
}

export interface InsertSiteResponse {
  insertVibeSite: MutationResponse;
}

export interface UpdateSiteResponse {
  updateVibeSite: MutationResponse;
}

export interface DeleteSiteResponse {
  deleteVibeSite: MutationResponse;
}

export interface InsertSiteParams {
  input: {
    OwnerId: string;
    Name: string;
    Slug: string;
    IsPublished: boolean;
    Pages: string;
  };
}

export interface UpdateSiteParams {
  filter: string;
  input: {
    Name?: string;
    Slug?: string;
    IsPublished?: boolean;
    Pages?: string;
  };
}
