// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
export const getSampleIndexDetails = () => {
  return {
    attributeTypeLookup: {
      _created_at: "DATE_VALUE",
      _file_type: "STRING_VALUE"
    },
    index: {
      DocumentMetadataConfigurations: [
        {
          Name: "_created_at",
          Type: "DATE_VALUE",
          Search: {
            Facetable: true,
            Searchable: true,
            Displayable: true,
          },
        },
        {
          Name: "_file_type",
          Type: "STRING_VALUE",
          Search: {
            Facetable: true,
            Searchable: true,
            Displayable: true,
          },
        }
      ],
      Id: "mock-index-id",
      Status: "ACTIVE",
    },
  };
};
