import React from "react";
import { disableTabFocus } from "../../util/dom/disableTabFocus";
import PropTypes from "prop-types";

const stop = e => {
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
  onFocusCapture(e) {
    e.target.blur();
  }
};

export class Lock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.whait = this.whait.bind(this);
  }

  whait(promise) {
    this.setState({ count: (this.state.count || 0) + 1 });
    return promise
      .then(() => {
        this.setState({ count: this.state.count - 1 });
      })
      .catch(() => {
        this.setState({ count: this.state.count - 1 });
      });
  }

  render() {
    const type = this.props.type || "div";
    let children = this.props.children || null;
    let stopFix;
    const locked = this.props.locked || this.state.count;
    const props2 = {
      ...this.props,
      ...(locked ? lockedListeners : {}),
      ref: locked
        ? el => {
            if (locked) {
              if (el) {
                el.setAttribute("lock", "locked");
                stopFix = disableTabFocus(el);
              } else {
                stopFix();
              }
            }
            if (this.props.containerRef) this.props.containerRef(el);
          }
        : el => {
            if (el) {
              el.setAttribute("lock", "open");
            }
            if (this.props.containerRef) this.props.containerRef(el);
          },
      children
    };
    delete props2.containerRef;
    delete props2.locked;
    delete props2.error;
    delete props2.type;
    return React.createElement(type, props2);
  }
}
Lock.propTypes = {
  type: PropTypes.string,
  children: PropTypes.node,
  locked: PropTypes.bool,
  containerRef: PropTypes.func
};
