import * as React from 'react';
import {AppState, Cena} from "../state";
import {ipcRenderer} from 'electron';

export interface CenasState {
}

export class Cenas extends React.Component<AppState,CenasState>{

    constructor(props:AppState) {
        super(props);
        this.state = {
        }
    }

    aplicar(uid:number){
        ipcRenderer.send('aplicar-cena',{uid})
    }

    salvarCena(uid:number){
        ipcRenderer.send('salvar-cena',{uid});
    }

    novoTempo(uid:number,tempo:number){
        ipcRenderer.send('editar-tempo-da-cena',{uid,tempo});
    }

    render() {
        return (
            <div style={{lineHeight:'2.5em'}}>
                <h1 style={{margin:'0'}}>Cenas</h1>
                {this.props.cenas.map((cena:Cena)=><div key={cena.uid} className={'cena'+(cena.uid == this.props.ultimaCena ? ' selected' :'')}>
                    <strong>{cena.nome}</strong>{' '}
                    <input type="number" value={cena.transicaoTempo || '0'}
                           style={{width:'60px'}}
                           onChange={(e:any)=>this.novoTempo(cena.uid,parseInt(e.target.value))}
                    />{' '}
                    <button onClick={()=>this.aplicar(cena.uid)}>Aplicar</button>{' '}
                    <strong>{cena.uid}</strong>{' '}
                    {
                        this.props.ultimaCena == cena.uid ?
                            <button onClick={()=>this.salvarCena(cena.uid)}>Salvar</button>
                            : null
                    }
                </div>)}

            </div>
        );
    }
}
