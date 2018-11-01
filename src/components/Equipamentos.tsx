import * as React from 'react';
import {ipcRenderer} from 'electron';

export interface EquipamentosState{
    monitorCriado: boolean
}

class AddForm extends React.Component<any,any> {
    constructor(props:any) {
        super(props);
        this.state = {
            inicio: 1,
            nome: '',
            tipo: 'glow64'
        }
    }

    render() {
        return (
            <div>
                Nome: <input type="text"
                             value={this.state.nome}
                             onChange={e=>this.setState({nome:(e.target as any).value})}/><br/>
                Início: <input type="number" value={this.state.inicio} onChange={e=>this.setState({inicio:parseInt((e.target as any).value)})}/><br/>
                Tipo: <select onChange={e=>this.setState({tipo:e.target.value})} value={this.state.tipo}>
                <option value="glow64">LED 64 GLOW</option>
                <option value="par16">PAR LED 16</option>
            </select><br/>
                <button onClick={()=>this.props.onSubmit(this.state.nome,this.state.tipo,this.state.inicio)}>Incluir</button>
            </div>
        );
    }

}

export class Equipamentos extends React.Component<any,any> {
    constructor(props:any){
        super(props);
        this.state = {
            equipamentos: []
        };
    }

    add(){
        this.setState({add:true});
    }

    changeColor (equipamento,cor){
        let r = parseInt(cor.substr(1,2),16),
            g = parseInt(cor.substr(3,2),16),
            b = parseInt(cor.substr(5,2),16);
        console.log(equipamento,cor,r,g,b);

        if ( equipamento.tipo == 'glow64' ) {
            const w = Math.min(r, g, b);
            r -= w;
            g -= w;
            b -= w;
            const data = {
                [equipamento.inicio]: r,
                [equipamento.inicio + 1]: g,
                [equipamento.inicio + 2]: b,
                [equipamento.inicio + 3]: w,
                [equipamento.inicio + 4]: 255
            };
            console.log(data);
            require('electron').ipcRenderer.send('dmx-update', data);
        } else if ( equipamento.tipo == 'par16' ) {

            const data = {
                [equipamento.inicio]: 255,
                [equipamento.inicio + 1]: r,
                [equipamento.inicio + 2]: g,
                [equipamento.inicio + 3]: b
            };
            console.log(data);
            require('electron').ipcRenderer.send('dmx-update', data);
        } else {
            console.error(equipamento,cor,r,g,b);
        }
    }

    render() {
        return <div>
            <h2 style={{margin:0,marginTop:'10px',fontSize:'inherit'}}>Equipamentos{' '}
                <strong style={{float:'right'}} onClick={()=>this.add()}>+</strong>
            </h2>
            {this.state.add ?

                <AddForm onSubmit={(nome:string,tipo:string,inicio:string)=>{
                    this.setState({
                        equipamentos: [
                            ...this.state.equipamentos,
                            {nome,inicio,tipo}
                        ],
                        add: false
                    })
                }} />


                : undefined }
            <div className="equipamentos">
                {this.state.equipamentos.map((e:any,index:number)=><div className="equipamento" key={index}>
                    <strong style={{fontSize:'12px'}}>{e.nome}</strong>
                    <strong style={{fontSize:'20px'}}>{e.inicio}</strong>
                    <br/>
                    <input type="color" onChange={(event)=>this.changeColor(e,event.target.value)} />
                    <select>
                        <option></option>
                        <option>askldjfhasdf</option>
                    </select>

                    <input type="checkbox" checked={true} title="Envio Automático"/>{' '}
                    <button>Enviar</button>
                </div>)}

            </div>

        </div>
    }
}
