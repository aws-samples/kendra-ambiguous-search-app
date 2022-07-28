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
    constructor(props: AmbiguousOptionProps) {
        super(props);
    }

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