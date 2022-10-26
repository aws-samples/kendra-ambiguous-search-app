// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
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