import * as React from "react";
import {action} from "../util/action";
import {Arquivo} from "../types/internal-state";

export interface ArquivosState {
  over: boolean;
}
export interface ArquivosProps {
  arquivos: Arquivo[]
}
export class Arquivos extends React.Component<ArquivosProps, ArquivosState> {
  constructor(props: undefined) {
    super(props);
    this.state = {
      over: false,
    };
  }

  onDragOver(e: any) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      ...this.state,
      over: true
    });
  }

  onDrop(e: any) {
    e.preventDefault();
    e.stopPropagation();
    const fs = e.dataTransfer.files as {path:string}[];
    const files: string[] = [];
    const invalids:string[] = [];
    for ( const file of fs ) {
        if (this.props.arquivos.find(f => f.path == file.path)) return;
        if (file.path.match(/\.(png|jpg|jpeg|gif)$/i))
            files.push(file.path);
        else if (file.path.match(/\.(mp4)$/i))
            files.push(file.path);
        else {
            invalids.push(file.path);
        }
    }
    if ( invalids.length ) {
        if ( invalids.length > 1 )
            alert("Arquivos inválidos.\n" + invalids.join(', '));
        else
            alert("Arquivo inválido.\n" + invalids[0]);
        return;
    }
    action({type:"novos-arquivos",arquivos:files});
  }

  onDragEnter(e: any) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      ...this.state,
      over: true
    });
  }

  onDragLeave(e: any) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      ...this.state,
      over: false
    });
  }

  render() {
    if ( (window as any).webMode )
        return (
            <div
                className={"arquivos" + (this.state.over ? " over" : "")}
            >
                <h2>Arquivos</h2>
                {this.props.arquivos.map((f: Arquivo) => (
                    <div key={f.path}>
                        {f.type == "img" ? <img src={f.path} /> : null}
                        {f.path}
                    </div>
                ))}
            </div>
        );

    return (
      <div
        className={"arquivos" + (this.state.over ? " over" : "")}
        onDrop={e => this.onDrop(e)}
        onDragEnter={e => this.onDragEnter(e)}
        onDragOver={e => this.onDragOver(e)}
        onDragLeave={e => this.onDragLeave(e)}
      >
        <h2>Arquivos</h2>
        {this.props.arquivos.map((f: Arquivo) => (
          <div key={f.path}>
            {f.type == "img" ? <img src={f.path} /> : null}
            {f.path}
          </div>
        ))}
      </div>
    );
  }
}
