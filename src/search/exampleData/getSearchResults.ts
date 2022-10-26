// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
import _ from "lodash";
import { exampleData1 } from "./exampleData1";
import { exampleData2 } from "./exampleData2";
import { exampleFilterData1 } from "./exampleFilterData1";
import { exampleFilterData2 } from "./exampleFilterData2";

export const getSearchResults = (pageNumber: number, filter: any) => {
  if (pageNumber % 2 === 1) {
    return !_.isEmpty(filter) ? exampleFilterData1 : exampleData1;
  } else {
    return !_.isEmpty(filter) ? exampleFilterData2 : exampleData2;
  }
};
