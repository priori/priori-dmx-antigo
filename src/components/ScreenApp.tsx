import * as React from "react";
import { AppInternalState } from "../types/internal-state";
import { listen, close } from "../util/listeners";
import { action } from "../util/action";

export interface ScreenAppState {
  state: AppInternalState | null;
}
export class ScreenApp extends React.Component<undefined, ScreenAppState> {
  private imgs: { [p: string]: any };
  private videos: { [p: string]: any };

  constructor(props: undefined) {
    super(props);
    this.state = { state: null };
    this.imgs = {} as { [k: string]: any };
    this.videos = {} as { [k: string]: any };
  }

  componentDidMount() {
    listen(this.listener);
    action({ type: "screen-started" });
  }

  componentWillUnmount() {
    close(this.listener);
  }

  listener = (state: AppInternalState) => {
    const currentState = this.state.state;
    if (currentState) {
      if (
        currentState.player.state != state.player.state ||
        state.player.arquivo != currentState.player.arquivo
      ) {
        if (state.player.state == "stop")
          this.stop(currentState.player.arquivo as string);

        if (state.player.state == "pause")
          this.pause(currentState.player.arquivo as string);

        if (
          state.player.state == "play" &&
          currentState.player.arquivo &&
          currentState.player.arquivo == state.player.arquivo
        ) {
          this.play(state.player.arquivo as string);
        }
        if (state.player.state == "play" && !currentState.player.arquivo) {
          this.play(state.player.arquivo as string);
        }
        if (
          state.player.state == "play" &&
          currentState.player.arquivo &&
          currentState.player.arquivo != state.player.arquivo
        ) {
          this.stop(currentState.player.arquivo as string);
          this.play(state.player.arquivo as string);
        }
      }
    }
    this.setState({
      state
    });
  }

  stop(path: string) {
    if (this.videos[path]) {
      this.videos[path].pause();
      this.videos[path].currentTime = 0;
      this.videos[path].style.opacity = 0;
    }
    if (this.imgs[path]) {
      this.imgs[path].style.opacity = 0;
    }
  }
  play(path: string) {
    if (this.videos[path]) {
      this.videos[path].play();
      this.videos[path].style.opacity = 1;
    }
    if (this.imgs[path]) {
      this.imgs[path].style.opacity = 1;
    }
  }
  pause(path: string) {
    if (this.videos[path]) {
      this.videos[path].pause();
      this.videos[path].style.opacity = 1;
    }
    if (this.imgs[path]) {
      this.imgs[path].style.opacity = 1;
    }
  }
  // <img
  // src={a.path}
  // key={a.path}
  // style={{
  //     opacity:
  //         state.player.arquivo == a.path &&
  //         state.player.state != "stop"
  //             ? 1
  //             : 0
  // }}
  // ref={el => (this.imgs[a.path] = el)}
  // />

  render() {
    const componentState = this.state;
    if (componentState.state === null) return null;
    const state = componentState.state;
    return (
      <div>
        {state.arquivos.map(a =>
          a.type == "img" ? (
            <div
              key={a.path}
              ref={el => (this.imgs[a.path] = el)}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",

                background:
                  "url('" +
                  a.path.replace(/\\/g, "\\\\") +
                  "') no-repeat 50% 50%",
                  backgroundSize: "contain",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                opacity:
                  state.player.arquivo == a.path && state.player.state != "stop"
                    ? 1
                    : 0
              }}
            />
          ) : a.type == "video" ? (
            <video
              key={a.path}
              src={a.path}
              preload="auto"
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                opacity:
                  state.player.arquivo == a.path && state.player.state != "stop"
                    ? 1
                    : 0
              }}
              ref={el => (this.videos[a.path] = el)}
            />
          ) : null
        )}
      </div>
    );
  }
}
