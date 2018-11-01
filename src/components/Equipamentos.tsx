import * as React from 'react';
import {ipcRenderer} from 'electron';
import {Equipamento} from "../state";

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
                Início: <input
                type="number"
                value={this.state.inicio}
                onChange={e=>this.setState({inicio:parseInt((e.target as any).value)})}/><br/>
                Tipo: <select onChange={(e:any)=>this.setState({tipo:e.target.value})} value={this.state.tipo}>
                <option value="glow64">LED 64 GLOW</option>
                <option value="par16">PAR LED 16</option>
            </select><br/>
                <button onClick={()=>this.props.onSubmit(this.state.nome,this.state.tipo,this.state.inicio)}>Incluir</button>
            </div>
        );
    }

}

export class Equipamentos extends React.Component<{equipamentos:Equipamento[]},any> {
    constructor(props:{equipamentos:Equipamento[]}){
        super(props);
        this.state = {
            equipamentos: []
        };
    }

    add(){
        this.setState({add:true});
    }

    changeColor (equipamento:Equipamento,cor:string){
        ipcRenderer.send('change-color',{equipamento:equipamento.uid,cor})
    }

    render() {
        return <div>
            <h2 style={{margin:0,marginTop:'10px',fontSize:'inherit'}}>Equipamentos{' '}
                <strong style={{float:'right'}} onClick={()=>this.add()}>+</strong>
            </h2>
            {this.state.add ?

                <AddForm onSubmit={(nome:string,tipo:string,inicio:string)=>{
                    ipcRenderer.send('create-equipamento',{nome,inicio,tipo})
                    this.setState({add: false});
                }} />
                : undefined }
            <div className="equipamentos">
                {this.props.equipamentos.map((e:Equipamento,index:number)=><div className="equipamento" key={index}>
                    <strong style={{fontSize:'12px'}}>{e.nome}</strong>
                    <strong style={{fontSize:'20px'}}>{e.inicio}</strong>
                    <br/>
                    <input type="color"
                           value={e.cor}
                           onChange={(event:any)=>this.changeColor(e,event.target.value)} />
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
