import * as React from "react";
import { AppInternalState } from "../types/internal-state";
import { listen, close } from "../util/listeners";
import { action } from "../util/action";

export interface ScreenAppState {
  state: any;
}
export class ScreenApp extends React.Component<undefined, ScreenAppState> {
  constructor(props: undefined) {
    super(props);
    this.state = { state: undefined };
  }
  componentDidMount() {
    listen(this.listener);
    action({ type: "screen-started" });
  }

  componentWillUnmount() {
    close(this.listener);
  }

  listener = (state: AppInternalState) => {
    this.setState({
      state
    });
  };

  render() {
    return <div>{JSON.stringify(this.state.state)}</div>;
  }
}
