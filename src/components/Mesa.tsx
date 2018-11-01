import * as React from 'react';

export interface MesaState{

}
export interface MesaProps{
    canais: {
        [index:number]: number
    }
}

function times(c:number){
    var a = [];
    while(c--)
    a.push({});
    return a;
}

export class Mesa extends React.Component<MesaProps,{}> {
    constructor(props:MesaProps){
        super(props);
        this.state = {}
    }

    changeSlider(index:number,e:any){
        const value = parseInt(e.target.value);
        this.setState({
            [index]: value
        });
        require('electron').ipcRenderer.send('slide',{index,value});
    }

    componentWillReceiveProps(nextProps:MesaProps){
        this.setState({...nextProps.canais});
    }

    render(){
        return <div className="mesa"><div>{times(255).map((_,index)=>
            <div key={index}>
                <div className="mesa__label">{index+1}</div>
                <div className="mesa__value">{
                    typeof this.state[index+1] != 'undefined' ? this.state[index+1] :
                    this.props.canais[index+1] || 0
                }</div>
                <div className="slider">
                    <input
                        min="0" max="255" type="range"
                        value={
                            typeof this.state[index+1] != 'undefined' ? this.state[index+1] :
                            this.props.canais[index+1]||'0'}
                        onChange={(e) => this.changeSlider(index+1,e)}/>
                </div>
            </div>)
        }</div>
        </div>
    }
}
