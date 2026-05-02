export const GET_SITES_QUERY = `
  query GetVibeSites($input: DynamicQueryInput) {
    getVibeSites(input: $input) {
      totalCount
      items {
        ItemId
        OwnerId
        Name
        Slug
        IsPublished
        CreatedDate
        LastUpdatedDate
        Pages
      }
    }
  }
`;
