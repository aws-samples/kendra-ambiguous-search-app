// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
import React from "react";
import Kendra from "aws-sdk/clients/kendra";

import DocumentResults from "./DocumentResults";
import FAQResults from "./FAQResults";
import TopResults from "./TopResults";

import { PAGE_SIZE, Relevance } from "./../constants";
import { AvailableSortingAttributesManager } from "../sorting/AvailableSortingAttributesManager";
import { SelectedSortingAttributeManager } from "../sorting/SelectedSortingAttributeManager";
import { ResultSorting } from "../sorting/ResultSorting";

import "../search.scss";

interface ResultsPanelProps {
  results: Kendra.QueryResult;
  topResults: Kendra.QueryResultItemList;
  faqResults: Kendra.QueryResultItemList;
  docResults: Kendra.QueryResultItemList;
  dataReady: boolean;
  currentPageNumber: number;
  availableSortingAttributes: AvailableSortingAttributesManager;
  selectedSortingAttribute: SelectedSortingAttributeManager;
  dulation: string, // dulation to search
  executedQuery: string, // executed query which can be typed query and ambiguous query
  onSortingAttributeChange: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  onSortingOrderChange: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;

  submitFeedback: (
    relevance: Relevance,
    resultItem: Kendra.QueryResultItem
  ) => Promise<void>;
}

export default class ResultsPanel extends React.Component<
  ResultsPanelProps,
  {}
> {
  private renderStatisticalInformation = () => {
    const { currentPageNumber, dataReady, results, dulation, executedQuery } = this.props;

    // Ensure spacing is always correct
    let pageIndex = <span>&nbsp;</span>;

    if (
      dataReady &&
      results?.TotalNumberOfResults &&
      results.TotalNumberOfResults > 0
    ) {
      const pageStart = (currentPageNumber - 1) * PAGE_SIZE + 1;
      const pageEnd = pageStart + (results.ResultItems!.length - 1);

      // Actually populate if ready
      const PRECISION = 3;
      let resultsLength: string = `${results.TotalNumberOfResults}`;
      if (resultsLength.length > PRECISION) {
        // Only get three most significant digits
        resultsLength =
          resultsLength.substr(0, PRECISION) +
          "0".repeat(resultsLength.length - PRECISION);
        // Add commas based on locale
        resultsLength = parseInt(resultsLength).toLocaleString();
      }

      if (resultsLength.length > PRECISION) {
        pageIndex = (
          <span>
            &nbsp;
            {pageStart}-{pageEnd} of about {resultsLength}
          </span>
        );
      } else {
        pageIndex = (
          <span>
            {pageStart}-{pageEnd} of {resultsLength} results
          </span>
        );
      }
    }

    return <div>
      <div>{pageIndex}</div>
      <div><span>Duration: {dulation}s</span></div>
      <div><span>Executed Query: {executedQuery}</span></div>
    </div>;
  };

  render() {
    const {
      topResults,
      faqResults,
      docResults,
      dataReady,
      submitFeedback,
    } = this.props;

    if (dataReady) {
      return (
        <div className="results-section">
          <div className="results-number">{this.renderStatisticalInformation()}</div>

          <TopResults results={topResults} submitFeedback={submitFeedback} />
          <FAQResults results={faqResults} submitFeedback={submitFeedback} />
          <ResultSorting
            availableSortingAttributes={this.props.availableSortingAttributes}
            selectedSortingAttribute={this.props.selectedSortingAttribute}
            onSortingAttributeChange={this.props.onSortingAttributeChange}
            onSortingOrderChange={this.props.onSortingOrderChange}
          />
          <DocumentResults
            results={docResults}
            submitFeedback={submitFeedback}
          />
        </div>
      );
    } else {
      return undefined;
    }
  }
}
