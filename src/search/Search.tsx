// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Kendra, { QueryRequest } from "aws-sdk/clients/kendra";
import { AWSError } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { ChangeEvent } from "react";
import { Spinner } from "react-bootstrap";
import { QueryResultType, Relevance, QuerySuggestionsMode } from "./constants";
import { getSampleIndexDetails } from "./exampleData/getSampleIndexDetails";
import { getSearchResults } from "./exampleData/getSearchResults";
import { AvailableFacetManager } from "./facets/AvailableFacetManager";
import { Facets } from "./facets/Facets";
import { SelectedFacetManager } from "./facets/SelectedFacetManager";
import {
  DataSourceNameLookup,
  getAttributeTypeLookup,
  getDataSourceNameLookup,
  IndexFieldNameToDocumentAttributeValueType,
} from "./facets/utils";
import Pagination from "./pagination/Pagination";
import ResultPanel from "./resultsPanel/ResultPanel";
import "./search.scss";
import SearchBar from "./searchBar/SearchBar";
import _ from "lodash";
import { AvailableSortingAttributesManager } from "./sorting/AvailableSortingAttributesManager";
import { SelectedSortingAttributeManager } from "./sorting/SelectedSortingAttributeManager";
import { DEFAULT_SORT_ATTRIBUTE, SortOrderEnum } from "./sorting/constants";
import S3 from "aws-sdk/clients/s3";
import { isNullOrUndefined } from "./utils";
import LanguageOption from "./languageOption/LanguageOption";
import AmbiguousOption from "./ambiguousOption/AmbiguousOption";
import { DEFAULT_LANGUAGE } from "./constants";
import { dynamodb, tableName } from "../services/Kendra";
import { DynamoDBClient, QueryCommandInput as DynamoQueryCommandInput } from "@aws-sdk/client-dynamodb";
import { QueryCommand as DynamoQueryCommand } from "@aws-sdk/client-dynamodb";

interface SearchProps {
  /* An authenticated instance of the Kendra SDK */
  kendra?: Kendra;
  /* The ID of an index in the account the Kendra SDK is authenticated for */
  indexId: string;

  s3?: S3;

  dynamodb?: DynamoDBClient;

  facetConfiguration?: {
    facetsToShowWhenUncollapsed: number;
    showCount: boolean;
    updateAvailableFacetsWhenFilterChange: boolean;
    facetPanelDefaultOpen: boolean;
  };
}

interface SearchState {
  dataReady: boolean;
  searchResults: Kendra.QueryResult;
  topResults: Kendra.QueryResultItemList;
  faqResults: Kendra.QueryResultItemList;
  docResults: Kendra.QueryResultItemList;
  currentPageNumber: number;
  queryText: string;
  error?: AWSError;
  index?: Kendra.DescribeIndexResponse;
  facetsOpen: boolean;
  suggestionsEnabled: boolean;

  // Faceting state
  attributeTypeLookup?: IndexFieldNameToDocumentAttributeValueType;
  availableFacets: AvailableFacetManager;
  dataSourceNameLookup?: DataSourceNameLookup;
  selectedFacets: SelectedFacetManager;

  // Sorting state
  availableSortingAttributes: AvailableSortingAttributesManager;
  selectedSortingAttribute: SelectedSortingAttributeManager;

  // datasources language
  language: string;

  // ambiguous search flag
  isAmbiguous: boolean

  // statistical information
  dulation: string, // dulation to search
  executedQuery: string // executed query which can be typed query and ambiguous query
}

export default class Search extends React.Component<SearchProps, SearchState> {
  constructor(props: SearchProps) {
    super(props);

    this.state = {
      dataReady: false,
      searchResults: {},
      topResults: [],
      faqResults: [],
      docResults: [],
      currentPageNumber: 1,
      queryText: "",
      error: undefined,
      attributeTypeLookup: undefined,
      availableFacets: AvailableFacetManager.empty(),
      selectedFacets: SelectedFacetManager.empty(),
      index: undefined,
      facetsOpen:
        (this.props.facetConfiguration &&
          this.props.facetConfiguration.facetPanelDefaultOpen) ??
        false,
      availableSortingAttributes: AvailableSortingAttributesManager.empty(),
      selectedSortingAttribute: SelectedSortingAttributeManager.default(),
      suggestionsEnabled: false,
      
      // datasource language
      language: DEFAULT_LANGUAGE,

      // ambiguous search flag
      isAmbiguous: false,

      // statistical information
      dulation: "", // dulation to search
      executedQuery: "" // executed query which can be typed query and ambiguous query
    };
  }

  async componentDidMount() {
    const { indexId, kendra } = this.props;

    if (kendra) {
      const listDataSourcePromise = this.listDataSources(kendra, indexId);
      const describeQuerySuggestionsConfigPromise = this.describeQuerySuggestionsConfig();

      try {
        // Create attribute type lookup from index
        const index = await kendra
          .describeIndex({
            Id: indexId,
          })
          .promise();

        this.setState({
          attributeTypeLookup: getAttributeTypeLookup(index),
          index: index,
        });

        // Get available sorting attributes from index meta data
        if (index.DocumentMetadataConfigurations) {
          this.setState({
            availableSortingAttributes: this.state.availableSortingAttributes.fromIndexMetadata(
              index.DocumentMetadataConfigurations
            ),
          });
        }

        // Create data source name lookup
        const dataSources = await listDataSourcePromise;
        const qsConfig = await describeQuerySuggestionsConfigPromise;
        this.setState({
          dataSourceNameLookup: getDataSourceNameLookup(dataSources),
          suggestionsEnabled: (qsConfig && qsConfig.Mode === QuerySuggestionsMode.ENABLED) ? true : false,
        });
      } catch (e: any) {
        this.setState({
          error: e,
        });
      }
    } else {
      // The SDK is not configured, use mock data
      this.setState({
        ...getSampleIndexDetails(),
      });
    }
  }

  listDataSources = async (
    kendra: Kendra,
    indexId: string
  ): Promise<Kendra.DataSourceSummaryList | null> => {
    try {
      let listDsResponse: PromiseResult<
        Kendra.ListDataSourcesResponse,
        AWSError
      > | null = await kendra
        .listDataSources({
          IndexId: indexId,
        })
        .promise();

      const dataSources = listDsResponse.SummaryItems || [];

      while (listDsResponse?.$response.hasNextPage()) {
        const nextPage: any = listDsResponse.$response.nextPage();
        if (nextPage) {
          listDsResponse = await nextPage.promise();
          if (listDsResponse?.SummaryItems) {
            dataSources.push(...listDsResponse.SummaryItems);
          }
        } else {
          listDsResponse = null;
        }
      }

      return dataSources;
    } catch (e: any) {
      this.setState({
        error: e,
      });
    }

    return null;
  };

  // get synonym from dynamodb
  getSynonym = async (k: string) => {
    const params: DynamoQueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: "keyword = :k",
      ExpressionAttributeValues: {
        ":k": { S: k }
      }
    }

    const result = await dynamodb?.send(new DynamoQueryCommand(params))
    return result
  }

  // get ambiguous query by using synonym
  getAmbiguousQuery = async (queryText: string) => {
    let ambiguousQuery = "";

    // convert full-width space into half-width space
    const query = queryText.replace('　', ' ');
    // split query text by half-width space
    const ql = query.split(' ');

    // add OR operator into query if there are synonym
    for (const q of ql) {
      try {
        const synonyms = await this.getSynonym(q);
        let rc = synonyms?.Count ?? 0;
        if (rc === 0) {
          ambiguousQuery = ambiguousQuery + q
        } else {
          ambiguousQuery = ambiguousQuery + '(' + q + ' OR '
          for (let i = 0; i < rc; i++) {
            if (i < rc - 1) {
              ambiguousQuery = ambiguousQuery + synonyms?.Items?.[0].synonym.L?.[i].S + ' OR '
            } else {
              ambiguousQuery = ambiguousQuery + synonyms?.Items?.[0].synonym.L?.[i].S + ') '
            }
          }
        }
      } catch (e) {
      }
    }

    return ambiguousQuery
  }

  private getResultsHelper = async (
    queryText: string,
    pageNumber: number,
    filter?: Kendra.AttributeFilter
  ) => {
    this.setState({ dataReady: false });


    // start measurement
    const start = performance.now();

    // set language code of datasources
    if (isNullOrUndefined(filter)) {
      filter = {
        "EqualsTo": {
          "Key": "_language_code",
          "Value": {
            "StringValue": this.state.language
          }
        }
      };
    } else {
      filter?.AndAllFilters?.push({
        EqualsTo: {
          Key: "_language_code",
          Value: {
            "StringValue": this.state.language
          }
        }
      })
    }

    let ambiguousQuery = "";
    // modify queryText to do ambiguous Search
    if (this.state.isAmbiguous) {
      ambiguousQuery = await this.getAmbiguousQuery(queryText)
    }

    let results: Kendra.QueryResult = getSearchResults(pageNumber, filter);

    const queryRequest: QueryRequest = {
      IndexId: this.props.indexId,
      QueryText: ambiguousQuery ? ambiguousQuery : queryText, // apply ambiguousQuery if exist
      PageNumber: pageNumber,
      AttributeFilter: filter ? filter : undefined,
    };

    const sortingAttribute = this.state.selectedSortingAttribute.getSelectedSortingAttribute();
    const sortingOrder = this.state.selectedSortingAttribute.getSelectedSortingOrder();

    if (sortingAttribute !== DEFAULT_SORT_ATTRIBUTE) {
      queryRequest.SortingConfiguration = {
        DocumentAttributeKey: sortingAttribute,
        SortOrder: sortingOrder!,
      };
    }

    if (this.props.kendra) {
      try {
        results = await this.props.kendra.query(queryRequest).promise();
      } catch (e: any) {
        this.setState({
          searchResults: {},
          topResults: [],
          faqResults: [],
          docResults: [],
          dataReady: true,
          error: e,
        });
        return;
      }
    } else {
      console.error(
        "WARNING: No Kendra SDK instance provided, using dummy data"
      );
    }

    // stop measurement
    const end = performance.now();
    // dulation
    const elapsed = (end - start) / 1000;
    const elapsedStr = elapsed.toPrecision(3);
    // show dulation
    this.setState({ dulation: elapsedStr})
    // show executed query
    this.setState({ executedQuery: ambiguousQuery ? ambiguousQuery : queryText })

    const tempTopResults: Kendra.QueryResultItemList = [];
    const tempFAQResults: Kendra.QueryResultItemList = [];
    const tempDocumentResults: Kendra.QueryResultItemList = [];

    if (results && results.ResultItems) {
      results.ResultItems.forEach((result: Kendra.QueryResultItem) => {
        if (!isNullOrUndefined(this.props.s3) && result.DocumentURI) {
          try {
            let res = result.DocumentURI.split("/");
            if (res[2].startsWith("s3")) {
              //The URI points to an object in an S3 bucket
              //Get presigned url from s3
              let bucket = res[3];
              let key = res[4];
              for (var i = 5; i < res.length; i++) {
                key = key + "/" + res[i];
              }
              let params = { Bucket: bucket, Key: key };
              let url = this.props.s3!.getSignedUrl("getObject", params);
              result.DocumentURI = url;
            }
          } catch {
            // Just do nothing, so the documentURI are still as before
          }
        }
        switch (result.Type) {
          case QueryResultType.Answer:
            tempTopResults.push(result);
            break;
          case QueryResultType.QuestionAnswer:
            tempFAQResults.push(result);
            break;
          case QueryResultType.Document:
            tempDocumentResults.push(result);
            break;
          default:
            break;
        }
      });

      // Only update availableFacets in two situations:
      // 1. There is no filter
      // 2. There is filter and the updateAvailableFacetsWhenFilterChange flag is true
      if (
        !filter ||
        (filter &&
          this.props.facetConfiguration?.updateAvailableFacetsWhenFilterChange)
      ) {
        this.setState({
          availableFacets: AvailableFacetManager.fromQueryResult(results),
        });
      }

      this.setState({
        searchResults: results,
        topResults: tempTopResults,
        faqResults: tempFAQResults,
        docResults: tempDocumentResults,
        dataReady: true,
        error: undefined,
      });
    } else {
      this.setState({
        searchResults: {},
        topResults: tempTopResults,
        faqResults: tempFAQResults,
        docResults: tempDocumentResults,
        dataReady: true,
        error: undefined,
      });
    }
    this.setState({
      currentPageNumber: pageNumber,
      queryText: queryText,
    });
  };

  // When submitting query from search bar, reset facets and sorting attributes
  getResults = async (queryText: string, pageNumber: number = 1) => {
    this.setState(
      {
        selectedFacets: this.state.selectedFacets.clearAll(),
        selectedSortingAttribute: SelectedSortingAttributeManager.default(),
      },
      () => {
        this.getResultsHelper(queryText, pageNumber);
      }
    );
  };

  getResultsOnPageChanging = async (
    queryText: string,
    pageNumber: number = 1
  ) => {
    this.computeFilterAndReSubmitQuery(queryText, pageNumber);
  };

  submitFeedback = async (
    relevance: Relevance,
    resultItem: Kendra.QueryResultItem
  ) => {
    if (!this.props.kendra) {
      console.error(
        "WARNING: No Kendra SDK instance provided, submit feedback ignored"
      );

      return;
    } else if (!this.props.indexId) {
      console.error(
        "WARNING: No Kendra Index Id provided, submit feedback ignored"
      );

      return;
    }

    const queryResult = this.state.searchResults;
    if (relevance !== Relevance.Click) {
      // Explicit relevance feedback
      const feedbackRequest: Kendra.SubmitFeedbackRequest = {
        IndexId: this.props.indexId,
        QueryId: queryResult.QueryId as string,
        RelevanceFeedbackItems: [
          {
            RelevanceValue: relevance as string,
            ResultId: resultItem.Id as string,
          },
        ],
      };

      this.props.kendra.submitFeedback(feedbackRequest).promise();
    } else {
      // Click feedback
      const feedbackRequest: Kendra.Types.SubmitFeedbackRequest = {
        IndexId: this.props.indexId,
        QueryId: queryResult.QueryId as string,
        ClickFeedbackItems: [
          {
            ClickTime: new Date(),
            ResultId: resultItem.Id as string,
          },
        ],
      };

      this.props.kendra.submitFeedback(feedbackRequest).promise();
    }
  };

  getQuerySuggestions = async (
    queryText: string
  ) : Promise<Kendra.Types.SuggestionList | undefined> => {
    const getQuerySuggestionsRequest : Kendra.Types.GetQuerySuggestionsRequest = {
      IndexId: this.props.indexId,
      QueryText: queryText,
    };
    if (this.props.kendra) {
        const response = await this.props.kendra.getQuerySuggestions(getQuerySuggestionsRequest).promise();
        if (response) {
            return response.Suggestions;
        }
    }
  };

  describeQuerySuggestionsConfig = async () : Promise<Kendra.Types.DescribeQuerySuggestionsConfigResponse | undefined> => {
    const describeQuerySuggestionsConfigRequest : Kendra.Types.DescribeQuerySuggestionsConfigRequest = {
      IndexId: this.props.indexId,
    };
    if (this.props.kendra) {
        return await this.props.kendra.describeQuerySuggestionsConfig(describeQuerySuggestionsConfigRequest).promise();
    }
  };

  private getErrorNotification = () => {
    return (
      <div className="error-div">
        {!_.isEmpty(this.state.error?.message)
          ? this.state.error?.message
          : this.state.error?.code}
      </div>
    );
  };

  private computeFilterAndReSubmitQuery(
    queryText: string,
    pageNumber: number = 1
  ) {
    const filter = this.state.selectedFacets.buildAttributeFilter(
      this.state.attributeTypeLookup
    );

    this.getResultsHelper(queryText, pageNumber, filter);
  }

  onSelectedFacetsChanged = (updatedSelectedFacets: SelectedFacetManager) => {
    this.setState(
      {
        selectedFacets: updatedSelectedFacets,
      },
      () => {
        this.computeFilterAndReSubmitQuery(this.state.queryText);
      }
    );
  };

  handleClickExpander = () => {
    this.setState({
      ...this.state,
      facetsOpen: !this.state.facetsOpen,
    });
  };

  onSortingAttributeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    this.setState(
      {
        selectedSortingAttribute: this.state.selectedSortingAttribute.setSelectedSortingAttribute(
          event.currentTarget.value
        ),
      },
      () => {
        this.computeFilterAndReSubmitQuery(this.state.queryText);
      }
    );
  };

  onSortingOrderChange = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const sortingOrder = this.state.selectedSortingAttribute.getSelectedSortingOrder();
    if (sortingOrder === SortOrderEnum.Desc) {
      this.setState(
        {
          selectedSortingAttribute: this.state.selectedSortingAttribute.setSelectedSortingOrder(
            SortOrderEnum.Asc
          ),
        },
        () => {
          this.computeFilterAndReSubmitQuery(this.state.queryText);
        }
      );
    } else if (sortingOrder === SortOrderEnum.Asc) {
      this.setState(
        {
          selectedSortingAttribute: this.state.selectedSortingAttribute.setSelectedSortingOrder(
            SortOrderEnum.Desc
          ),
        },
        () => {
          this.computeFilterAndReSubmitQuery(this.state.queryText);
        }
      );
    }
  };

  render() {
    return (
      <div>
        {this.state.error && this.getErrorNotification()}
        <SearchBar
            onSubmit={this.getResults}
            suggestionsEnabled={this.state.suggestionsEnabled}
            getQuerySuggestions={this.getQuerySuggestions}
        />

        <LanguageOption
          onLanguageChange={(event) => {
            this.setState({
              language: event.target.value
            })
          }} />

        <AmbiguousOption onAmbiguousChange={(e) => {
          this.setState((value) => {
            return { isAmbiguous: !value.isAmbiguous }
          })
        }}/>

        {this.state.queryText && this.state.dataReady && (
          <div className="search-container">
            <div className="search-facet-container">
              <Facets
                availableFacets={this.state.availableFacets}
                attributeTypeLookup={this.state.attributeTypeLookup}
                dataSourceNameLookup={this.state.dataSourceNameLookup}
                onSelectedFacetsChanged={this.onSelectedFacetsChanged}
                selectedFacets={this.state.selectedFacets}
                index={this.state.index}
                open={this.state.facetsOpen}
                onExpand={this.handleClickExpander}
              />
            </div>
            <div className="search-result-container">
              {this.state.searchResults.TotalNumberOfResults === 0 && (
                <div className="empty-results center-align">
                  Kendra didn't match any results to your query.
                </div>
              )}
              {this.state.searchResults.TotalNumberOfResults !== 0 && (
                <div>
                  <ResultPanel
                    results={this.state.searchResults}
                    topResults={this.state.topResults}
                    faqResults={this.state.faqResults}
                    docResults={this.state.docResults}
                    dataReady={this.state.dataReady}
                    currentPageNumber={this.state.currentPageNumber}
                    submitFeedback={this.submitFeedback}
                    availableSortingAttributes={
                      this.state.availableSortingAttributes
                    }
                    selectedSortingAttribute={
                      this.state.selectedSortingAttribute
                    }
                    dulation={this.state.dulation}
                    executedQuery={this.state.executedQuery}
                    onSortingAttributeChange={this.onSortingAttributeChange}
                    onSortingOrderChange={this.onSortingOrderChange}
                  />
                  <Pagination
                    queryText={this.state.queryText}
                    currentPageNumber={this.state.currentPageNumber}
                    onSubmit={this.getResultsOnPageChanging}
                    results={this.state.searchResults}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {this.state.queryText && !this.state.dataReady && (
          <div className="results-section center-align">
            <Spinner
              className="result-spinner"
              animation="border"
              variant="secondary"
            />
          </div>
        )}
      </div>
    );
  }
}
