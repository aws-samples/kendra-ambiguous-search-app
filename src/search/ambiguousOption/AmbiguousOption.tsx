// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";
import { Form } from "react-bootstrap";

interface AmbiguousOptionProps {
    onAmbiguousChange: React.ChangeEventHandler<HTMLInputElement>;
}
interface AmbiguousOptionState {

}

export default class AmbiguousOption extends React.Component<
    AmbiguousOptionProps,
    AmbiguousOptionState
> {
    render() {
        return <div className="ambiguous-option-container">
            <Form.Check
                type={"checkbox"}
                label={<span>Ambiguous Search Mode</span>}
                onChange={this.props.onAmbiguousChange}
            />
        </div>;
    }
}