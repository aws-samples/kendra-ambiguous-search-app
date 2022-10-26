// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
import { SelectedSortingAttributeRetriever } from "./SelectedSortingAttributeRetriever";
import { DEFAULT_SORT_ATTRIBUTE, SortOrderEnum } from "./constants";

export class SelectedSortingAttributeManager
  implements SelectedSortingAttributeRetriever {
  constructor(
    private sortingAttribute: string,
    private sortingOrder: string | null
  ) {
    this.sortingAttribute = sortingAttribute;
    this.sortingOrder = sortingOrder;
  }

  static default() {
    return new SelectedSortingAttributeManager(DEFAULT_SORT_ATTRIBUTE, null);
  }

  getSelectedSortingAttribute(): string {
    return this.sortingAttribute;
  }

  getSelectedSortingOrder(): string | null {
    return this.sortingOrder;
  }

  setSelectedSortingAttribute(
    sortingAttribute: string
  ): SelectedSortingAttributeManager {
    if (sortingAttribute === DEFAULT_SORT_ATTRIBUTE) {
      return new SelectedSortingAttributeManager(sortingAttribute, null);
    } else {
      return new SelectedSortingAttributeManager(
        sortingAttribute,
        SortOrderEnum.Desc
      );
    }
  }

  setSelectedSortingOrder(
    sortingOrder: string
  ): SelectedSortingAttributeManager {
    return new SelectedSortingAttributeManager(
      this.sortingAttribute,
      sortingOrder
    );
  }
}
