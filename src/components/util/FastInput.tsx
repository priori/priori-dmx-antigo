import * as React from "react";

export function FastInput(props:{className?:string,style?:any,type?:string,initialValue:string,onChange:(value:string)=>void,onCancel:()=>void}) {

    return <input
        className={props.className}
        type={props.type||'text'}
        defaultValue={props.initialValue}
        ref={el => {
            if (el) {
                el.focus();
                el.select();
            }
        }}
        style={props.style}
        onBlur={(e: any) => props.onChange(e.target.value)
        }
        onKeyDown={(e:any)=>{
            if ( e.key == 'Escape' ) {
                props.onCancel();
            } else if ( e.key == 'Enter' ) {
                props.onChange(e.target.value);
            }
        }}
    />
}
