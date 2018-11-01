import * as React from 'react';

import {ipcRenderer} from 'electron';

const options = [
    {value:'artnet',nome:'EnttecODE ArtNet'},
    {value:'bbdmx',nome:'BeagleBone-DMX (bbdmx)'},
    {value:'dmx4all',nome:'DMX4ALL (NanoDMX USB Interface Like)'},
    {value:'enttec-usb-dmx-pro',nome:'Enttec USB DMX Pro'},
    {value:'enttec-open-usb-dmx',nome:'Enttec Open DMX USB'},
    {value:'dmxking-utra-dmx-pro',nome:'DMXKing Ultra DMX'}
] as {value:string,nome:string}[];

export interface ConexaoDMXProps {conectado:boolean,driver:string,deviceId:string};
export class ConexaoDMX extends React.Component<ConexaoDMXProps,{conectando:boolean}>{

    deviceIdEl:HTMLInputElement;
    driverEl:HTMLSelectElement;

    constructor(props:{conectando:boolean}) {
        super(props);
        this.state = {conectando:false};
    }

    componentWillReceiveProps(next:{conectado:boolean}){
        const nextState = ConexaoDMX.getDerivedStateFromProps(next,this.state);
        if ( nextState != this.state)
            this.setState(nextState);
    }

    static getDerivedStateFromProps(nextProps:{conectado:boolean}, prevState:{conectando:boolean}){
        if ( nextProps.conectado && prevState.conectando )
            return {...prevState,conectando:false};
        return prevState;
    }

    render(){
        return <div className='conexao-dmx'>
            <select defaultValue={this.props.driver} ref={el=>this.driverEl = el}>
                {options.map(op=> <option value={op.value} key={op.value}>{op.nome}</option> )}
            </select>
            {' '}
            <input type="text" defaultValue={this.props.deviceId} ref={el=>this.deviceIdEl = el}/>
            {' '}
            {
                this.props.conectado ?
                    <span><strong>Conectado...</strong> <button onClick={()=>this.desconectar()}>Desconectar</button></span> :
                    <button onClick={() => this.conectar()}>Conectar</button>
            }
            {this.state.conectando?' ...':''}
        </div>
    }

    conectar(){
        if ( this.state.conectando || this.props.conectado )return;
        this.setState({
            conectando: true
        });
        ipcRenderer.send('dmx-conectar',{driver:this.driverEl.value,deviceId:this.deviceIdEl.value});
    }
    desconectar(){
        if ( this.props.conectado )
            ipcRenderer.send('dmx-desconectar');
    }
}