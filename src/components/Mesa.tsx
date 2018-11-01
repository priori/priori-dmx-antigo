import * as React from 'react';

export interface MesaState{

}
export interface MesaProps{

}

function times(c:number){
    var a = [];
    while(c--)
    a.push({});
    return a;
}

export class Mesa extends React.Component<any,MesaProps> {
    constructor(props:MesaProps){
        super(props);
        this.state = {};
    }

    changeSlider(index:number,e:any){
        const value = e.target.value;
        this.setState({
            [index]: Math.floor(value)
        },()=>this.ready());
    }

    ready(){
        require('electron').ipcRenderer.send('dmx-update',this.state );
    }

    render(){
        return <div className="mesa"><div>{times(255).map((_,index)=>
            <div key={index}>
                <div className="mesa__label">{index+1}</div>
                <div className="mesa__value">{this.state[index+1] || 0}</div>
                <div className="slider">
                    <input
                        min="0" max="255" type="range"
                           defaultValue="0"
                           onChange={(e) => this.changeSlider(index+1,e)}/>
                </div>
            </div>)
        }</div>
        </div>
    }
}
