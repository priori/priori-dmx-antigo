import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Lock } from "./Lock";
import { lock } from "../../util/dom/lock";
import PropTypes from "prop-types";

let count = 0;
let lastModal;

function keydownListener(e) {
  if (lastModal) {
    if (
      (document.activeElement == null ||
        document.activeElement.tagName == "HTML" ||
        document.activeElement.tagName == "BODY") &&
      e.key == "Escape" &&
      lastModal.state.props.closeOnEsc &&
      lastModal.state.props.onClose
    ) {
      lastModal.state.props.onClose(e);
    }
  }
}

function startKeydownListener() {
  window.addEventListener("keydown", keydownListener);
}

function removeKeydownListener() {
  window.removeEventListener("keydown", keydownListener);
}

class ModalEl extends Component {
  constructor(props) {
    super(props);
    this.ref = this.ref.bind(this);
    this.closeKeyPress = this.closeKeyPress.bind(this);
    this.state = {};
    this.lastModal = lastModal;
    lastModal = this;
  }

  componentWillUnmount() {
    lastModal = this.lastModal;
  }

  ref(el) {
    if (el == this.el) return;
    if (el && this.el) {
      throw "Inconsistent component lifecycle!";
    }
    if (el) {
      this.el = el;
      this.rootEl = el.parentNode;
      // const h = el.offsetHeight;
      this.rootEl.className =
        (this.rootEl.className ? this.rootEl.className + " " : "") + "active";
      if (
        document.activeElement &&
        document.activeElement != document.body &&
        document.activeElement != document.documentElement
      ) {
        this.prevActiveElement = document.activeElement;
        this.prevActiveElement.blur();
      }
      this.lock = lock(el);
    }
  }

  closeKeyPress(e) {
    if (e.key == "Enter" || e.key == " ") {
      this.state.props.onClose(e);
    }
  }

  render() {
    if (!this.state.props) return null;
    const props = { ...this.state.props };
    let children = props.children;
    delete props.children;
    if (props.onClose) {
      const onClose = props.onClose;
      if (children instanceof Array) {
        children = [
          <i
            className="fa fa-close"
            onClick={onClose}
            key={-1}
            tabIndex={0}
            onKeyPress={this.closeKeyPress}
          />,
          ...children
        ];
      } else if (children) {
        children = [
          <i
            className="fa fa-close"
            onClick={onClose}
            key={-1}
            tabIndex={0}
            onKeyPress={this.closeKeyPress}
          />,
          children
        ];
      } else {
        children = null;
      }
    }
    delete props.closeOnClickOutside;
    delete props.onClose;
    delete props.closeOnEsc;
    return (
      <Lock
        className="modal"
        {...props}
        locked={this.state.locked}
        containerRef={this.ref}
      >
        {children}
      </Lock>
    );
  }

  setProps(props) {
    this.setState({ props });
  }

  destroy() {
    this.setState({ locked: true });
    document.body.className = document.body.className
      .replace(/(^|\s)modal-open($|\s)/g, " ")
      .replace(/\s+$|^\s+/, "");
    this.rootEl.className = this.rootEl.className.replace(/ ?active$/g, "");
    this.lock();
    if (this.prevActiveElement) {
      setTimeout(() => this.prevActiveElement.focus(), 1);
    }
    setTimeout(() => {
      if (this.rootEl.parentNode) {
        count--;
        if (count == 0) {
          removeKeydownListener();
          document.body.style.overflowY = null;
          document.body.style.paddingRight = null;
        }
        this.rootEl.parentNode.removeChild(this.rootEl);
        ReactDOM.unmountComponentAtNode(this.wrapperEl);
      }
    }, 500);
  }
}

export class Modal extends Component {
  constructor(props) {
    super(props);
    this.ref = this.ref.bind(this);
  }

  static open(func) {
    let success, err, htmlEl;
    const promise = new Promise((success2, err2) => {
      success = success2;
      err = err2;
    });
    const close = arg => {
      ReactDOM.unmountComponentAtNode(htmlEl);
      success(arg);
    };
    const closeWithError = arg => {
      ReactDOM.unmountComponentAtNode(htmlEl);
      err(arg);
    };
    if (typeof func != "function") {
      throw "Argumento inválido. Função esperada.";
    }
    let el = func(close, closeWithError);
    if (
      el.type != Modal &&
      (!el.type || !el.type.prototype || !(el.type.prototype instanceof Modal))
    ) {
      throw "Retorno da função passada como parâmetro não é uma Modal.";
    }
    htmlEl = document.createElement("div");
    ReactDOM.render(el, htmlEl);
    el = null;
    return promise;
  }

  ref(component) {
    if (this.component == component) return;
    if (this.component && component) {
      throw "Inconsistent component lifecycle!";
    }
    if (component) {
      this.component = component;
      this.component.wrapperEl = this.wrapperEl;
      component.setProps(this.props);
    }
  }

  componentDidMount() {
    const el = document.createElement("div");
    el.style.overflowY = "scroll";
    el.className = "modal-wrapper";
    el.addEventListener(
      "click",
      e => {
        if (
          this.props.closeOnClickOutside &&
          this.props.onClose &&
          el == e.target
        ) {
          this.props.onClose(e);
        }
      },
      false
    );
    document.body.appendChild(el);
    document.body.className =
      (document.body.className ? " " : "") + "modal-open";
    const w = document.body.scrollWidth;
    count++;
    if (count == 1) {
      document.body.style.paddingRight = null;
      document.body.style.overflowY = "hidden";
      document.body.style.paddingRight = document.body.scrollWidth - w + "px";
      startKeydownListener();
    }
    this.wrapperEl = el;
    ReactDOM.render(<ModalEl ref={this.ref} />, el);
  }

  componentWillUnmount() {
    this.component.destroy();
  }

  render() {
    if (this.component)
      setTimeout(() => this.component.setProps(this.props), 1);
    return null;
  }
}
Modal.propTypes = {
  closeOnClickOutside: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  onClose: PropTypes.func
};
