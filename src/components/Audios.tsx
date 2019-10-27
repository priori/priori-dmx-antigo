import {Arquivo, PlayerState} from "../types/internal-state";
import * as React from "react";
import {action} from "../util/action";

export interface AudiosProps {
    arquivos: Arquivo[];
    player: {
        repeat: boolean,
        arquivo: string | null;
        state: PlayerState;
        volume: number;
    };
}
export interface AudiosState {}

export class Audios extends React.Component<AudiosProps, AudiosState> {

    private els: any = {};
    private oldProps: AudiosProps|null = null;
    private current: any;

    newProps() {
        if ( !this.oldProps ) {
            if ( this.props.player.arquivo && this.els[this.props.player.arquivo] && this.props.player.state == "play" ) {
                this.els[this.props.player.arquivo].play();
                this.current = this.els[this.props.player.arquivo];
            }
            if ( this.props.player.arquivo && this.els[this.props.player.arquivo] && this.props.player.state == "pause" ) {
                this.els[this.props.player.arquivo].pause();
            } else if (this.current && this.props.player.state == "pause" ) {
                this.current.pause();
            }
            if ( this.props.player.arquivo && this.els[this.props.player.arquivo] && this.props.player.state == "stop" ) {
                this.els[this.props.player.arquivo].stop();
            } else if ( this.current && this.props.player.state == "stop" ) {
                this.current.stop();
            }
            this.oldProps = this.props;
        } else {
            if ( this.oldProps.player.state != this.props.player.state ||
                this.oldProps.player.arquivo != this.props.player.arquivo ) {
                if (this.props.player.state == "stop")
                    this.stop(this.oldProps.player.arquivo as string);

                if (this.props.player.state == "pause")
                    this.pause(this.oldProps.player.arquivo as string);

                if (
                    this.props.player.state == "play" &&
                    this.oldProps.player.arquivo &&
                    this.oldProps.player.arquivo == this.props.player.arquivo
                ) {
                    this.play(this.props.player.arquivo as string);
                }
                if (this.props.player.state == "play" && !this.oldProps.player.arquivo) {
                    this.play(this.props.player.arquivo as string);
                }
                if (
                    this.props.player.state == "play" &&
                    this.oldProps.player.arquivo &&
                    this.oldProps.player.arquivo != this.props.player.arquivo
                ) {
                    this.stop(this.oldProps.player.arquivo as string);
                    this.play(this.props.player.arquivo as string);
                }
                this.oldProps = this.props;
            } else if ( this.oldProps.player.volume != this.props.player.volume ) {
                for ( const key in this.els ) {
                    const el = this.els[key];
                    el.volume = this.props.player.volume;
                }
                this.oldProps = this.props;
            }
        }
    }

    private stop(arquivo: string) {
        if ( this.els[arquivo] ) {
            this.els[arquivo].pause();
            this.els[arquivo].currentTime = 0;
        }
    }

    private pause(arquivo: string) {
        if ( this.els[arquivo] )
            this.els[arquivo].pause();
    }

    private play(arquivo: string) {
        if ( this.els[arquivo] )
            this.els[arquivo].play();
    }

    render() {
        setTimeout(() => {
            this.newProps();
        }, 10);
        return <span style={{display: "none"}}>
        {
            this.props.arquivos.filter(a => a.type == "audio")
                .map(a => <audio
                    key={a.path}
                    ref={el => this.els[a.path] = el}
                    onEnded={() => {
                        if ( this.props.player.repeat && this.props.player.arquivo == a.path )
                            this.els[a.path].play();
                        else
                            action({type: "arquivo-stop"});
                    }}
                >
                    <source src={a.path}
                            type={a.path.match(/\.mp3$/) ? "audio/mpeg" : "audio/ogg"} />
                </audio>)
        }
    </span>;
    }
}
