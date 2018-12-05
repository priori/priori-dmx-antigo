import * as React from "react";
import { action } from "../util/action";
import { Arquivo, PlayerState } from "../types/internal-state";
import { Monitor } from "./Monitor";

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
  player: {
    state: PlayerState;
    arquivo: string | null;
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
        {this.props.arquivos.length ? null : (
          <h2 style={{ margin: "0", paddingBottom: "20px" }}>Arquivos</h2>
        )}

        <Monitor telas={this.props.telas} />

          {this.props.arquivos.length ?
              <div className="arquivos__controles">
                  <button
                      style={{
                          opacity: null === this.props.telas.aberta ? 0.5 : 1
                      }}
                      onClick={() => this.stop()}
                  >
                      <i className="fa fa-stop"/>
                  </button>
                  {" "}
                  <button
                      style={{
                          opacity:
                              null === this.props.telas.aberta || this.state.selected === null
                                  ? 0.5
                                  : 1
                      }}
                      onClick={() => this.play()}
                  >
                      <i className="fa fa-play"/>
                  </button>
                  {" "}
                  <button
                      style={{
                          opacity: this.props.telas.aberta === null ? 0.5 : 1
                      }}
                      onClick={() => this.pause()}
                  >
                      <i className="fa fa-pause"/>
                  </button>
                  {" "}
              </div>
              : null
          }
        <div style={{ overflow: "auto", maxHeight: "300px" }}>
          {this.props.arquivos.map((f: Arquivo) => (
            <div
              key={f.path}
              className={
                "arquivo" +
                (this.state.selected == f.path ? " selected" : "") +
                (this.props.player.arquivo === f.path ? " na-tela" : "")
              }
              onClick={() => this.select(f)}
            >
              <span className="arquivo__state">
                {this.props.player.arquivo == f.path ? (
                  this.props.player.state == "play" ? (
                    <i className="fa fa-play" />
                  ) : this.props.player.state == "pause" ? (
                    <i className="fa fa-pause" />
                  ) : null
                ) : null}
              </span>
              <strong>{f.nome}</strong>{" "}
              {f.type == "img" && this.props.showThumbs ? (
                <img src={f.path} />
              ) : null}{" "}
              {f.path}
                <i className="fa fa-close" onClick={()=>this.removeArquivo(f)}></i>
            </div>
          ))}
        </div>
      </div>
    );
  }

  private removeArquivo(f:Arquivo){
    if ( !confirm("Tem certeza que deseja remover o arquivo?"))
      return;
    action({type:"remove-arquivo",arquivo: f.path})
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
    if (this.props.telas.aberta === null) throw "Arquivo não selecionado.";
    action({ type: "arquivo-stop" });
  }

  private play() {
    if (this.props.telas.aberta === null || this.state.selected === null)
      throw "Arquivo não selecionado.";
    action({ type: "arquivo-play", path: this.state.selected });
  }

  private pause() {
    if (this.props.telas.aberta === null) throw "Arquivo não selecionado.";
    action({ type: "arquivo-pause" });
  }
}
