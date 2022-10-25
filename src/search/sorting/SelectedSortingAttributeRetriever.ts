// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Kendra from "aws-sdk/clients/kendra";

export interface SelectedSortingAttributeRetriever {
  getSelectedSortingAttribute(): string;

  getSelectedSortingOrder(): string | null;
}
