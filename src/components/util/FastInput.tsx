import * as React from "react";

export interface FastInputProps {
  className?: string;
  style?: any;
  type?: string;
  initialValue: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  min?: number;
  max?: number;
  onClick?: (e: any) => void;
  onMouseDown?: (e: any) => void;
}
export class FastInput extends React.Component<FastInputProps, {}> {
  private started: boolean;
  constructor(props: FastInputProps) {
    super(props);
    this.started = true;
  }
  // shouldComponentUpdate(nextProps:FastInputProps,nextState:{}){
  //     if (!deepEquals(nextState, this.state)) return true;
  //     for (const i of keys(nextProps, this.props)) {
  //         if ( i.startsWith('on') )
  //             continue;
  //         const isEquals = deepEquals((this.props as any)[i], (nextProps as any)[i]);
  //         if (!isEquals) {
  //             if (typeof (this as any)[i + "Prop"] != "function") return true;
  //         }
  //     }
  //     return false;
  // }
  inputRef = (el: any) => {
    if (el) {
      el.focus();
      el.select();
    }
  };
  onKeyDown = (e: any) => {
    if (e.key == "Escape") {
      this.props.onCancel();
    } else if (e.key == "Enter") {
      this.props.onChange(e.target.value);
    }
  };
  onBlur = (e: any) => this.props.onChange(e.target.value);
  render() {
    const props = this.props;
    if ( props.type == "textarea")
      return (
          <textarea
              className={props.className}
              defaultValue={props.initialValue}
              ref={this.inputRef}
              onClick={props.onClick}
              onMouseDown={props.onMouseDown}
              min={props.min}
              max={props.max}
              style={props.style}
              // onBlur={this.onBlur}
              onKeyDown={this.onKeyDown}
          />);
    return (
      <input
        className={props.className}
        type={props.type != "textarea" ? props.type || "text" : undefined}
        defaultValue={props.initialValue}
        ref={this.inputRef}
        onClick={props.onClick}
        onMouseDown={props.onMouseDown}
        min={props.min}
        max={props.max}
        style={props.style}
        onBlur={this.onBlur}
        onKeyDown={this.onKeyDown}
      />
    );
  }
}
