import * as React from "react";
import { AppState } from "../types";
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

  listener = (state: AppState) => {
    this.setState({
      state
    });
  };

  render() {
    return <div>{JSON.stringify(this.state.state)}</div>;
  }
}
