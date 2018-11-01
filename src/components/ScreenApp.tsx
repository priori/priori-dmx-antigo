import * as React from 'react';
import {ipcRenderer} from 'electron';
import {AppState} from "../state";

export interface ScreenAppState{
  state: any
}
export class ScreenApp extends React.Component<undefined, ScreenAppState> {

  constructor(props:undefined) {
      super(props);
      this.state = {state:undefined};
  }
  componentDidMount(){
    ipcRenderer.on('state',(event,state:AppState)=>{
      this.setState({
          state
      });
    });
    ipcRenderer.send('screen-started');
  }

  render () {
    return <div>
        {JSON.stringify(this.state.state)}
      </div>
  }
}
