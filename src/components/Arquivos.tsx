import * as React from "react";
import { action } from "../util/action";
import { Arquivo } from "../types/internal-state";
import {Monitor} from "./Monitor";

export interface ArquivosState {
  over: boolean;
  selected: string | null;
}
export interface ArquivosProps {
  arquivos: Arquivo[];
  showThumbs: boolean;
  telas: {
      aberta: number | null;
      disponiveis: { width: number; height: number }[];
  };
}
export class Arquivos extends React.Component<ArquivosProps, ArquivosState> {
  constructor(props: undefined) {
    super(props);
    this.state = {
      over: false,
      selected: null
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
    const fs = e.dataTransfer.files as { path: string }[];
    const files: string[] = [];
    const invalids: string[] = [];
    for (const file of fs) {
      if (this.props.arquivos.find(f => f.path == file.path)) return;
      if (file.path.match(/\.(png|jpg|jpeg|gif)$/i)) files.push(file.path);
      else if (file.path.match(/\.(mp4)$/i)) files.push(file.path);
      else {
        invalids.push(file.path);
      }
    }
    if (invalids.length) {
      if (invalids.length > 1)
        alert("Arquivos inválidos.\n" + invalids.join(", "));
      else alert("Arquivo inválido.\n" + invalids[0]);
      return;
    }
    action({ type: "novos-arquivos", arquivos: files });
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
    const dragListeners = (window as any).webMode
      ? {}
      : {
          onDrop: (e: any) => this.onDrop(e),
          onDragEnter: (e: any) => this.onDragEnter(e),
          onDragOver: (e: any) => this.onDragOver(e),
          onDragLeave: (e: any) => this.onDragLeave(e)
        };

    return (
      <div
        className={"arquivos" + (this.state.over ? " over" : "")}
        {...dragListeners}
      >
        <h2 style={{ margin: "0", paddingBottom: "10px" }}>Arquivos</h2>

          <Monitor telas={this.props.telas} />

        <div
          style={{
            padding: "0 20px 10px 20px",
            opacity: null === this.props.telas.aberta || this.state.selected === null ? 0.5 : 1
          }}
        >
          <button onClick={() => this.pause()}>Pause</button>{" "}
          <button onClick={() => this.play()}>Play</button>{" "}
          <button onClick={() => this.stop()}>Stop</button>{" "}
        </div>
        <div style={{ overflow: "auto", height: "300px" }}>
          {this.props.arquivos.map((f: Arquivo) => (
            <div
              key={f.path}
              className={
                "arquivo" + (this.state.selected == f.path ? " selected" : "")
              }
              onClick={() => this.select(f)}
            >
              <strong>{f.nome}</strong>{" "}
              {f.type == "img" && this.props.showThumbs ? (
                <img src={f.path} />
              ) : null}
              {f.path}
            </div>
          ))}
        </div>
      </div>
    );
  }

  private select(f: Arquivo) {
    if (f.path == this.state.selected) {
      this.setState({
        ...this.state,
        selected: null
      });
    } else {
      this.setState({
        ...this.state,
        selected: f.path
      });
    }
  }

  private stop() {
    if (this.props.telas.aberta===null || this.state.selected === null) throw "Arquivo não selecionado.";
    action({ type: "arquivo-stop" });
  }

  private play() {
    if (this.props.telas.aberta===null || this.state.selected === null) throw "Arquivo não selecionado.";
    action({ type: "arquivo-play", path: this.state.selected });
  }

  private pause() {
    if (this.props.telas.aberta===null || this.state.selected === null) throw "Arquivo não selecionado.";
    action({ type: "arquivo-pause" });
  }
}
