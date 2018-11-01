import * as React from 'react';
import {ipcRenderer} from 'electron';
import {Monitor} from './Monitor'
import {Server} from "./Server";
// import {Arquivo, Arquivos} from './Arquivos';
import {ConexaoDMX} from "./ConexaoDMX";
import {Mesa} from "./Mesa";
import {Equipamentos} from "./Equipamentos";
import {AppState} from "../state";

const empty = {};
export class App extends React.Component<undefined, AppState|{}> {

    constructor(props:undefined){
        super(props);
        this.state = empty;
        ipcRenderer.send('app-start');
        ipcRenderer.on('state',(_:any,data:AppState)=>{
            this.setState(data);
        });
    }

//     setArquivos(arquivos:Arquivo[]){
//         this.setState({
//             arquivos
//         },()=>ipcRenderer.send('state',this.state));
//     }

    render() {
        if ( this.state == empty )return null;
        const state = this.state as AppState;
        return (
            <div>
                <Monitor />
                <Server/>
                <ConexaoDMX {...state.dmx} />
                <Mesa values={state.canais} />
                <Equipamentos/>
                {/*<Arquivos onChange={arquivos=>this.setArquivos(arquivos)} />*/}
            </div>
        );
    }
}
