// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
import Kendra from "aws-sdk/clients/kendra";
import moment from "moment";

export type DateRange = { min: moment.Moment; max: moment.Moment };

export interface SelectedFacetRetriever {
  getStringSelectionsOf(attributeKey: string): Kendra.DocumentAttributeValue[];

  getDateRangeSelectionsOf(attributeKey: string): DateRange | undefined;

  isSelected(
    attributeKey: string,
    attributeValue: Kendra.DocumentAttributeValue
  ): boolean;

  getAllSelected(): {
    [key: string]: Kendra.DocumentAttributeValue[];
  };

  isEmpty(): boolean;
}
