// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
import Kendra from "aws-sdk/clients/kendra";

export type YearHeuristic = { [year: number]: number };

export interface AvailableDateFacet {
  minYear: number;
  maxYear: number;
  yearHeuristic: YearHeuristic;
}

export type DateFacetChangeHandler = (
  key: Kendra.DocumentAttributeKey,
  changeDetail?: [number, number]
) => void;

export type FacetValue = Kendra.DocumentAttributeValueCountPair & {
    ValueLabel: string;
};
