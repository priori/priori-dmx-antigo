import * as React from "react";
import { FastInput } from "./util/FastInput";
import { action } from "../util/action";
import { Arquivo, PlayerState } from "../types/internal-state";
import { Audios } from "./Audios";
import Timer = NodeJS.Timer;

export interface ArquivosState {
  over: boolean;
  selected: string | null;
  volume: undefined | number;
  editandoNome: undefined | string;
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
    repeat: boolean;
    arquivo: string | null;
    volume: number;
  };
}

export class Arquivos extends React.Component<ArquivosProps, ArquivosState> {
  constructor(props: undefined) {
    super(props);
    this.state = {
      over: false,
      selected: null,
      volume: undefined,
      editandoNome: undefined
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
    this.setState({
      ...this.state,
      over: false
    });
    const fs = e.dataTransfer.files as { path: string }[];
    const files: string[] = [];
    const invalids: string[] = [];
    for (const file of fs) {
      if (this.props.arquivos.find(f => f.path == file.path)) return;
      if (file.path.match(/\.(png|jpg|jpeg|gif)$/i)) files.push(file.path);
      else if (file.path.match(/\.(mp4)$/i)) files.push(file.path);
      else if (file.path.match(/\.(mp3|ogg)$/i)) files.push(file.path);
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

  isAudio() {
    const selected = this.state.selected
        ? this.props.arquivos.filter(a => a.path == this.state.selected)[0]
        : undefined;
    const audio = selected && selected.type == "audio";
    return audio;
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

    const telaAberta = this.props.telas.aberta !== null;
    const audio = this.isAudio();
    const naoHaTela = this.state.selected && !audio && this.props.telas.aberta === null;
    const naoHaArquivoSelecionado = this.state.selected === null;

    return (
      <div
        className={"arquivos" + (this.state.over ? " over" : "")}
        {...dragListeners}
      >
        {this.props.arquivos.length ? null : (
          <h2 style={{ margin: "0", paddingBottom: "20px" }}>Arquivos</h2>
        )}

        {naoHaArquivoSelecionado ? (
            <div className="arquivos__message">Não há arquivo selecionado.</div>
        ): naoHaTela ? (
          <div className="arquivos__message">Não há tela criada.</div>
        ) : null}

        {this.props.arquivos.length ? (
          <div
            className="arquivos__controles"
          >
            <span style={{opacity: naoHaTela || naoHaArquivoSelecionado ? 0.33 : undefined}}>
            <button
              style={{
                opacity: !audio && !telaAberta ? 0.5 : 1
              }}
              onClick={() => this.stop()}
            >
              <i className="fa fa-stop" />
            </button>{" "}
            <button
              onClick={() => this.play()}
            >
              <i className={"fa fa-play"+(this.props.player.state == "play" ? " playing" : "")} />
            </button>{" "}
            <button
              onClick={() => this.pause()}
            >
              <i className="fa fa-pause" />
            </button>
            </span>{" "}
            <button onClick={() => this.repeat()}>
              <i
                className="fa fa-repeat"
                style={{
                  opacity: this.props.player.repeat ? 1 : 0.33,
                  color: this.props.player.repeat ? "#029" : undefined
                }}
              />
            </button>
            <div className="volume">
              <strong>Volume:</strong>
              <input
                type="range"
                value={
                  typeof this.state.volume == "undefined"
                    ? this.props.player.volume * 100.0
                    : this.state.volume * 100.0
                }
                onChange={(e: any) =>
                  this.setVolume(parseFloat(e.target.value) / 100.0)
                }
              />
            </div>
          </div>
        ) : null}
        <div className="arquivos__itens">
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
              {
                f.type == "audio" ?
                    <i className="fa fa-music" />
                    :
                    f.type == "img" ?
                    <i className="fa fa-picture-o" />
                    : <i className="fa fa-video-camera" />
              }
              <strong>
                {f.path == this.state.editandoNome ? (
                  <FastInput
                      type="textarea"
                    className="cena__nome"
                    initialValue={f.nome}
                    onMouseDown={(e: any) => {
                      e.stopPropagation();
                    }}
                    onClick={(e: any) => {
                      e.stopPropagation();
                    }}
                    onChange={(value: string) => {
                      action({
                        type: "editar-nome-do-arquivo",
                        path: f.path,
                        nome: value
                      });
                      this.setState({ ...this.state, editandoNome: undefined });
                    }}
                    onCancel={() =>
                      this.setState({ ...this.state, editandoNome: undefined })
                    }
                  />
                ) : null }
                {f.nome}
              </strong>{" "}
              {f.type == "img" && this.props.showThumbs ? (
                <img src={f.path} />
              ) : null}{" "}
              {/* {f.path} */}
              {f.path == this.state.selected && !this.state.editandoNome ? (
                <span
                    className="arquivo__controles"
                >
                  <i
                    className="fa fa-pencil arquivo__controle"
                    onClick={(e: any) => {
                      this.renameArquivo(f);
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  />{" "}
                  <i
                    className="fa fa-close arquivo__controle"
                    onClick={() => this.removeArquivo(f)}
                  />
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <Audios arquivos={this.props.arquivos} player={this.props.player} />
      </div>
    );
  }

  private renameArquivo(f: Arquivo) {
    this.setState({ ...this.state, editandoNome: f.path });
  }

  private removeArquivo(f: Arquivo) {
    if (!confirm("Tem certeza que deseja remover o arquivo?")) return;
    action({ type: "remove-arquivo", path: f.path });
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
    if (!this.isAudio() && this.props.telas.aberta === null)
      throw "Não há tela aberta.";
    action({ type: "arquivo-stop" });
  }

  private play() {
    if (!this.isAudio() && this.props.telas.aberta === null)
      throw "Não há tela aberta.";
    if (this.state.selected === null) throw "Arquivo não selecionado.";
    action({ type: "arquivo-play", path: this.state.selected });
  }

  private pause() {
    if (!this.isAudio() && this.props.telas.aberta === null)
      throw "Não há tela aberta.";
    action({ type: "arquivo-pause" });
  }

  private repeat() {
    action({ type: "repeat" });
  }

  private volumeSlideTimeout: undefined | Timer;
  private setVolume(volume: number) {
    this.setState({ ...this.state, volume });
    if (this.volumeSlideTimeout) clearTimeout(this.volumeSlideTimeout);
    this.volumeSlideTimeout = setTimeout(() => {
      this.setState({ ...this.state, volume: undefined });
    }, 2000);
    action({ type: "volume", volume });
  }
}
