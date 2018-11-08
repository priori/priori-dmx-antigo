import * as React from "react";

export interface SoftPanelProps {
  // children: React.ReactNode
  onBlur: () => void;
}
export class SoftPanel extends React.Component<SoftPanelProps, {}> {
  blur = (e: any) => {
    if (
      (this.el as any) != e.relatedTarget &&
      !this.el.contains(e.relatedTarget)
    ) {
      this.props.onBlur();
    }
  };

  ref = (el: any) => {
    if (el) {
      el.focus();
      this.el = el;
    }
  };

  mouseDown = (e: any) => {
    e.stopPropagation();
  };

  keyDown = (e: any) => {
    if (e.key == "Escape") this.props.onBlur();
  };
  private el: HTMLDivElement;

  render() {
    return (
      <div
        className="soft-panel"
        onBlurCapture={this.blur}
        tabIndex={0}
        ref={this.ref}
        onMouseDownCapture={this.mouseDown}
        onKeyDown={this.keyDown}
      >
        {this.props.children}
      </div>
    );
  }
}
