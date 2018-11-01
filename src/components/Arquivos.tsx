import * as React from 'react';

let uidCount = 0;
export interface Arquivo {
    type: 'img'|'video',
    path: string,
    uid: number
}
export interface ArquivosState {
    files: Arquivo[]
    over: boolean
}
export interface ArquivosProps{
    onChange(arquivos:Arquivo[]):void
}
export class Arquivos extends React.Component<ArquivosProps,ArquivosState> {

    constructor(props:undefined){
        super(props);
        this.state = {
            over: false,
            files: []
        };
    }

    onDragOver(e){
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            ...this.state,
            over: true
        });
    }

    onDrop(e){
        e.preventDefault();
        e.stopPropagation();
        const fs = e.dataTransfer.files;
        const files:Arquivo[] = [...this.state.files];
        [...fs].forEach((file:{path:string})=>{
            if ( files.find(f => f.path == file.path) )
                return;
            if ( file.path.match(/\.(png|jpg|jpeg|gif)$/i) )
                files.push({ path: file.path, type: 'img', uid: ++uidCount });
            else if ( file.path.match(/\.(mp4)$/i) )
                files.push({ path: file.path, type: 'video', uid: ++uidCount });
            else
                alert('Arquivo inválido.\n'+file.path);
        });
        this.setState({
            ...this.state,
            files,
            over: false
        });
        this.props.onChange(files);
    }

    onDragEnter(e){
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            ...this.state,
            over: true
        });
    }

    onDragLeave(e){
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            ...this.state,
            over: false
        });
    }

    render () {
        return <div
            className={'arquivos'+(this.state.over?' over':'')}
            onDrop={(e)=>this.onDrop(e)}
            onDragEnter={(e)=>this.onDragEnter(e)}
            onDragOver={(e)=>this.onDragOver(e)}
            onDragLeave={(e)=>this.onDragLeave(e)} >
            <h2>Arquivos</h2>
            {
                this.state.files.map((f:Arquivo)=><div key={f.path}>
                    {f.type == 'img'? <img src={f.path}/>: null}
                    {f.path}
                </div>)
            }
        </div>
    }
}