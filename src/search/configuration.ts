// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
export const facetConfiguration = {
  /*
   * The max number of facets to show when uncollapsed
   */
  facetsToShowWhenUncollapsed: 5,

  /*
   * The max number of facets that can be selected
   */
  maxSelectedFacets: 5,

  /*
   * true: show the count of results of each facet
   * false: NOT show the count of results of each facet
   */
  showCount: true,

  /*
   * true: the available facets will be updated upon filter selections change
   * false: the available facets will NOT be updated upon filter selections change
   */
  updateAvailableFacetsWhenFilterChange: true,

  /*
   * true: facet panel will be expanded by default
   * false: facet panel will be collapsed by default
   */
  facetPanelDefaultOpen: false,
};
