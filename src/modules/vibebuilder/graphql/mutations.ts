export const INSERT_SITE_MUTATION = `
  mutation InsertVibeSite($input: VibeSiteInsertInput!) {
    insertVibeSite(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UPDATE_SITE_MUTATION = `
  mutation UpdateVibeSite($filter: String!, $input: VibeSiteUpdateInput!) {
    updateVibeSite(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const DELETE_SITE_MUTATION = `
  mutation DeleteVibeSite($filter: String!, $input: VibeSiteDeleteInput!) {
    deleteVibeSite(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const INSERT_FORM_SUBMISSION_MUTATION = `
  mutation InsertVibeFormSubmission($input: VibeFormSubmissionInsertInput!) {
    insertVibeFormSubmission(input: $input) {
      itemId
      acknowledged
    }
  }
`;
