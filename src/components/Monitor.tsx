import * as React from "react";
import {action} from "../util/action";

export class Monitor extends React.Component<{ telas: { aberta: number|null, disponiveis: {width:number,height:number}[] } }, {}> {
  select: any = null;

  render() {
    return (
      <div className="monitor">
        <select ref={el => (this.select = el)} onChange={() => this.change()}>
          {this.props.telas.disponiveis.map((d, i) => (
            <option key={i} value={i}>
              {i + 1}) {d.width}x{d.height}
            </option>
          ))}
        </select>{" "}
        {this.props.telas.aberta === null ? (
          <button onClick={() => this.criarMonitor()}>Criar Tela</button>
        ) : (
          <strong>Tela Criada</strong>
        )}
      </div>
    );
  }

  change() {
    if (this.props.telas.aberta !== null ) {
      action({type:'ativar-tela',
          index: parseInt(this.select.value)
      });
    }
  }

  criarMonitor() {
    action({type:'ativar-tela',
      index: parseInt(this.select.value)
    });
  }
}
