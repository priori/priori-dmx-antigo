import * as React from 'react';
import {ipcRenderer,screen} from 'electron';

export interface MonitorState{
    monitorCriado: boolean
}
export class Monitor extends React.Component<undefined, MonitorState> {

  constructor(props:undefined){
      super(props);
      this.state = {monitorCriado:false};
      ipcRenderer.on('screen-closed',()=>{
          this.setState({
              monitorCriado: false
          });
      });
  }

  render () {
    return <div className="monitor">
      <select ref={el=>this.select = el} onChange={()=>this.change()}>
        {screen.getAllDisplays().map((d,i) => <option key={d.id} value={d.id}>{i+1}) {d.size.width}x{d.size.height}</option> )}
      </select>{' '}
      {
        !this.state.monitorCriado ?
        <button onClick={()=>this.criarMonitor()}>Criar Tela</button>:
        <strong>Tela Criada</strong>
      }
    </div>
  }

  change(){
    if ( this.state.monitorCriado ) {
      ipcRenderer.send('new-screen-request',{
        id: parseInt(this.select.value)
      });
    }
  }

  criarMonitor(){
      this.setState({
          monitorCriado: true
      });
      ipcRenderer.send('new-screen-request',{
        id: parseInt(this.select.value)
      });
  }
}
