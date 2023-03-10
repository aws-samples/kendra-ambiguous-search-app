// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";
import LocalCredentialsBanner from "./services/helpers/LocalCredentialsBanner";
import MockDataWarning from "./services/helpers/MockDataWarning";
import Search from "./search/Search";
import { kendra, indexId, errors, s3, dynamodb } from "./services/Kendra";
import { facetConfiguration } from "./search/configuration";

import "./App.css";

function App() {
  return (
    <div className="App">
      {errors.length > 0 ? (
        <MockDataWarning errors={errors} />
      ) : (
        <LocalCredentialsBanner />
      )}

      <Search
        kendra={kendra}
        s3={s3}
        dynamodb={dynamodb}
        indexId={indexId}
        facetConfiguration={facetConfiguration}
      />
    </div>
  );
}

export default App;
