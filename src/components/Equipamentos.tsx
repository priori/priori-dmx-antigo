import * as React from 'react';
import {ipcRenderer} from 'electron';
import {Equipamento} from "../state";
import {times} from "../util";

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

export interface EquipamentosProps{
    equipamentos:Equipamento[],
    canais: {
        [key:number]: number
    }
}

export class Equipamentos extends React.Component<EquipamentosProps,any> {
    constructor(props:{equipamentos:Equipamento[]}){
        super(props);
        this.state = {
            add: false,
            canais: {}
        };
    }

    add(){
        this.setState({
            ...this.state,
            add:true});
    }

    componentWillReceiveProps(nextProps:EquipamentosProps){
        this.setState({
            ...this.state,
            canais:{...nextProps.canais}
        });
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
                    <div className="equipamento__main">
                        <strong style={{fontSize:'12px'}}>{e.nome}</strong>
                    <br/>
                    <input type="color"
                           value={e.cor}
                           onChange={(event:any)=>this.changeColor(e,event.target.value)} /><br/>
                        {/*<select>*/}
                            {/*<option></option>*/}
                            {/*<option>askldjfhasdf</option>*/}
                        {/*</select><br/>*/}
                        {/*<input type="checkbox" checked={true} title="Envio Automático"/>{' '}*/}
                        <button>Enviar</button>
                        <br/>
                        <strong style={{fontSize:'20px'}}>{e.inicio}</strong>
                    </div>
                    <div className="equipamento__canais">
                    <strong>Canais</strong><br/>
                    {
                        e.tipo == 'glow64' ?
                            times(8).map((_:any,index:number) => <div key={index } className="equipamento__canal">
                                <span className="equipamento__canal__index">{e.inicio + index}</span>
                                <input
                                    onChange={(event:any)=>this.updateCanal(index+e.inicio,event.target.value)}
                                    type="range"
                                    min="0"
                                    className="equipamento__canal__input"
                                    max="255"
                                    value={typeof this.state.canais[index+e.inicio] != 'undefined' ? this.state.canais[e.inicio+index] :
                                        this.props.canais[index+e.inicio]||'0'}
                            />
                                <span className="equipamento__canal__valor">
                                    {typeof this.state.canais[index+e.inicio] != 'undefined' ? this.state.canais[e.inicio+index] :
                                        this.props.canais[index+e.inicio]||'0'}
                                </span>
                            </div>) :
                            times(4).map((_:any,index:number) => <div key={index} className="equipamento__canal">
                                <span className="equipamento__canal__index">{e.inicio + index}
                                </span><input
                                    onChange={(event:any)=>this.updateCanal(index+e.inicio,event.target.value)}
                                    type="range"
                                    className="equipamento__canal__input"
                                    min="0"
                                    max="255"
                                    value={typeof this.state.canais[index+e.inicio] != 'undefined' ? this.state.canais[e.inicio+index] :
                                            this.props.canais[index+e.inicio]||'0'}
                            />
                                <span className="equipamento__canal__valor">
                                    {typeof this.state.canais[index+e.inicio] != 'undefined' ? this.state.canais[e.inicio+index] :
                                            this.props.canais[index+e.inicio]||'0'}
                                </span>
                            </div>) 
                            
                    }
                    </div>
                </div>)}
            </div>
        </div>
    }

    private updateCanal(index: number, val: string) {
        const value = parseInt(val);
        this.setState({
            ...this.state,
            canais: {
                ...this.state.canais,
                [index]: val
            }
        });
        require('electron').ipcRenderer.send('slide',{index,value});
    }
}
