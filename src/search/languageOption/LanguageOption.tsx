// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";
import { languageType, langType } from "../constants";

interface LanguageOptionProps {
    onLanguageChange: (
        event: React.ChangeEvent<HTMLSelectElement>
      ) => void;
}
interface LanguageOptionState {

}

export default class LanguageOption extends React.Component<
    LanguageOptionProps,
    LanguageOptionState
> {
    getSortingAttributeSelectOptions = (attributeList: langType[]) => {
        return (
            <optgroup className="opt-group">
                {
                    attributeList.map((al) => {
                        return <option value={al.code} key={al.code}>{al.name}</option>
                    })
                }
            </optgroup>
        );
    };

    render() {
        return <div className="language-option-container">
            <div className="query-result-sorting-container">
                <span className="sort-text">Language: </span>
                <div className="sorting-attributes-dropdown">
                    <select
                        name="select"
                        className="sorting-attribute-select"
                        onChange={this.props.onLanguageChange}
                    >
                        {this.getSortingAttributeSelectOptions(languageType)}
                    </select>
                </div>
            </div>
        </div >;
    }
}