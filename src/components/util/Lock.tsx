import * as React from "react";
import { disableTabFocus } from "../../util/dom/disableTabFocus";

const stop = (e:any) => {
  if (e.key === "Tab") return;
  e.preventDefault();
  e.stopPropagation();
};

const lockedListeners = {
  onMouseDownCapture: stop,
  onMouseUpCapture: stop,
  onClickCapture: stop,
  onKeyPressCapture: stop,
  onKeyDownCapture: stop,
  onFocusCapture(e:any) {
    e.target.blur();
  }
};

export interface LockProps {
  type?: string;
  containerRef?: (v:HTMLElement) => void;
  locked: boolean;
}

export class Lock extends React.Component<LockProps,{count?:number}> {
  constructor(props:LockProps) {
    super(props);
    this.state = {};
    this.whait = this.whait.bind(this);
  }

  whait(promise:Promise<any>) {
    this.setState({ count: (this.state.count || 0) + 1 });
    return promise
      .then(() => {
        this.setState({ count: (this.state.count||0) - 1 });
      })
      .catch(() => {
        this.setState({ count: (this.state.count||0) - 1 });
      });
  }

  render() {
    const type = this.props.type || "div";
    let children = this.props.children || null;
    let stopFix:(undefined|(() => void)) = undefined;
    const locked = this.props.locked || this.state.count;
    const props2 = {
      ...this.props,
      ...(locked ? lockedListeners : {}),
      ref: locked
        ? (el:HTMLElement) => {
            if (locked) {
              if (el) {
                el.setAttribute("lock", "locked");
                stopFix = disableTabFocus(el);
              } else if (stopFix) {
                stopFix();
              }
            }
            if (this.props.containerRef) this.props.containerRef(el);
          }
        : (el:HTMLElement) => {
            if (el) {
              el.setAttribute("lock", "open");
            }
            if (this.props.containerRef) this.props.containerRef(el);
          },
      children
    };
    delete props2.containerRef;
    delete props2.locked;
    delete props2.type;
    return React.createElement(type, props2);
  }
}