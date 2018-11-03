import * as React from 'react';
import {ipcRenderer} from 'electron';
import {Monitor} from './Monitor'
import {Server} from "./Server";
// import {Arquivo, Arquivos} from './Arquivos';
import {ConexaoDMX} from "./ConexaoDMX";
import {Mesa} from "./Mesa";
import {Equipamentos} from "./Equipamentos";
import {AppState} from "../state";
import {Cenas} from "./Cenas";

const empty = {};
export class App extends React.Component<{}, AppState|{}> {

    constructor(props:{}) {
        super(props);
        this.state = empty;
        ipcRenderer.send('app-start');
        let ready = false;
        ipcRenderer.on('state',(_:any,data:AppState)=>{
            if ( ready )
                this.setState(data);
            else
                this.state = data;
        });
        ready = true;
    }

//     setArquivos(arquivos:Arquivo[]){
//         this.setState({
//             arquivos
//         },()=>ipcRenderer.send('state',this.state));
//     }

    inputEl:HTMLInputElement|null = null
    salvarMesa(){
        const nome = this.inputEl && this.inputEl.value || '';
        if ( this.inputEl )
            this.inputEl.value = '';
       ipcRenderer.send("salvar-mesa",{nome});
    }

    render() {
        if ( this.state == empty )return null;
        const state = this.state as AppState;
        return (
            <div>
                {state.animacao ?
                <div style={{position:'fixed',top:'0',right:'0',bottom:'0',left:'0',background:'rgba(255,255,255,.6)',zIndex:1}}
                ref={(el)=>{
                    if ( el ) {
                        if ( document.activeElement && (document.activeElement as any).blur )
                            (document.activeElement as any).blur();
                    }
                }
                }>
                </div>
                    : null }
                <Monitor />
                <Server/>
                <ConexaoDMX {...state.dmx} />
                <div style={{textAlign:'right',paddingBottom:'5px'}}>
                    <input type="text" ref={el=>this.inputEl = el}/>{' '}
                    <button onClick={()=>this.salvarMesa()}>Salvar</button>
                </div>
                <Mesa canais={state.canais} />
                <Equipamentos equipamentos={state.equipamentos} canais={state.canais}/>

                <Cenas {...state} />
                {/*<Arquivos onChange={arquivos=>this.setArquivos(arquivos)} />*/}
            </div>
        );
    }
}
