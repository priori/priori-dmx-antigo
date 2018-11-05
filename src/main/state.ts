import { BrowserWindow, ipcMain} from 'electron';
import {AppState, Cena, Equipamento} from "../state";
import * as path from "path";
import * as fs from "fs";
const DMX = require('dmx'),
    dmx = new DMX;

interface IpcEvent {
    sender: IpcSender
}
interface IpcSender {
    send(name:string,val?:any):void
}
let screen:BrowserWindow|null;
let appSender:IpcSender|null = null;

let state:AppState = {
    window: {
        criando: false,
        criada: false
    },
    dmx: {
        conectado: false,
        driver: 'enttec-usb-dmx-pro',
        deviceId: 'COM5'
    },
    ultimaCena: null,
    animacao: false,
    canais: {},
    equipamentos: [],
    cenas: []
};

function getDir() {
    if ((global as any).process.env.APPDATA) {
        return (global as any).process.env.APPDATA;
    } else if ((global as any).process.env.HOME) {
        return (global as any).process.env.HOME;
    } else {
        return null;
    }
}
const dir = getDir();
if ( !fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
const file = path.join(dir,'priori-dmx.json');
if ( !fs.existsSync(file)){
    fs.writeFileSync(file,JSON.stringify(state));
} else {
    const fileContent = fs.readFileSync(file).toString();
    if ( fileContent ) {
        const json = JSON.parse(fileContent) as AppState;
        if ( json ) {
            state = json;
            if ( state.dmx.conectado ) {
                dmx.addUniverse('main',state.dmx.driver,state.dmx.deviceId);
                dmx.update('main',state.canais);
            }
        }
    }
}

let screenSender:IpcSender|null;
// ipcMain.on('state',(_:IpcEvent,newState:any)=>{
//     state = newState;
//     if ( screenSender )
//         screenSender.send('state',state);
// });

ipcMain.on('screen-start',(event:IpcEvent)=>{
    screenSender = event.sender;
    // screenSender.send('state',state);
    setState({
        ...state,
        window: {
            ...state.window,
            criando: false,
            criada: true
        }
    })
});

ipcMain.on('app-start',(event:IpcEvent)=>{
    if ( appSender && appSender != event.sender )
        throw 'Invalid sender.';
    appSender = event.sender;
    appSender.send('state',state);
});

const maxThrotle = 1000;
const throtleTime = 20;
let timeoutThrotle:any;
let firstThrotle:Date|null = null;
function setState(newState:AppState){
    if ( !appSender )throw 'Sem appSender.';
    state = newState;
    if ( timeoutThrotle )
        clearTimeout(timeoutThrotle);
    if ( !firstThrotle )
        firstThrotle = new Date;
    else if ( (new Date).getTime() - firstThrotle.getTime() > maxThrotle ){
        firstThrotle = null;
        if ( !appSender )throw 'Sem appSender.';
        fs.writeFileSync(file,JSON.stringify(state));
        appSender.send('state',state);
        if ( screenSender )
            screenSender.send('state',state);
        return;
    }
    timeoutThrotle = setTimeout(()=>{
        if ( !appSender )throw 'Sem appSender.';
        fs.writeFileSync(file,JSON.stringify(state));
        appSender.send('state',state);
        if ( screenSender )
            screenSender.send('state',state);
    },throtleTime);
}

function on(name:string,func:(e:any)=>void){
    ipcMain.on(name,(event:IpcEvent,e:any)=>{
        if ( event.sender != appSender )
            throw 'Invalid sender.';
        func(e);
    });
}
// ipcMain.on('dmx-update',(_:IpcEvent,values:any)=>{
//     dmx.update('main',values);
// });

on('dmx-conectar',(e:any)=>{
    dmx.addUniverse('main',e.driver,e.deviceId);
    dmx.update('main',state.canais);
    setState({
        ...state,
        dmx: {
            ...state.dmx,
            conectado: true,
            driver: e.driver,
            deviceId: e.deviceId
        }
    })
});

let uidCount = state.equipamentos.length || state.cenas.length ? 
	Math.max(...state.equipamentos.map(e=>e.uid),...state.cenas.map(c=>c.uid))+1 : 1;
on('create-equipamento',({nome,inicio,tipo})=>{
    setState({
        ...state,
        equipamentos: [
            ...state.equipamentos,
            {
                uid: uidCount++,
                nome,
                inicio,
                tipo
            }
        ]
    })
});


function buildCanaisFromCor(e:Equipamento,cor:string) {
    let r = parseInt(cor.substr(1,2),16),
        g = parseInt(cor.substr(3,2),16),
        b = parseInt(cor.substr(5,2),16);

    if ( e.tipo == 'glow64' ) {
        const brancoDosOutros = 3;
        let w = Math.min(r, g, b);
        r -= w;
        g -= w;
        b -= w;
        w = w * (brancoDosOutros+1);
        if ( w > 255 ) {
            const inc = Math.floor((w-255) / (brancoDosOutros) );
            r += inc;
            g += inc;
            b += inc;
            w = 255;
        }
        return {
            [e.inicio]: r,
            [e.inicio + 1]: g,
            [e.inicio + 2]: b,
            [e.inicio + 3]: w,
            [e.inicio + 4]: r || g|| b|| w ? 255 : 0
        };
    } else if ( e.tipo == 'par16' ) {
        return {
            [e.inicio]: r||g||b  ? 255 : 0,
            [e.inicio + 1]: r,
            [e.inicio + 2]: g,
            [e.inicio + 3]: b
        };
    } else {
        console.error('Tipo desconhecido. '+JSON.stringify(e));
        return {};
    }
}


on('change-color',(e)=>{
    const {cor} = e;
    const uid = e.equipamento;
    const equipamento = state.equipamentos.filter(e=>e.uid == uid)[0] || null;
    const data = buildCanaisFromCor(equipamento,cor);

    if ( state.dmx.conectado)
        dmx.update('main',data);
    setState({
        ...state,
        canais: {
            ...state.canais,
            ...data
        },
        equipamentos: state.equipamentos.map(e=> e.uid == uid ? {
            ...e,
            cor
        }: e)
    });
})

on('dmx-desconectar',()=>{
    dmx.universes.main.close();
    delete dmx.universes.main;
    setState({
        ...state,
        dmx: {
            ...state.dmx,
            conectado: false
        }
    });
});

on('slide',(e:any)=>{
    if ( typeof e.index != 'number' ) {
        console.error('index invalido ' + e.index + '. typeof ' + (typeof e.index));
        return;
    }
    if ( typeof e.value != 'number' ) {
        console.error('value invalido ' + e.value + '. typeof ' + (typeof e.value));
        return;
    }
    if ( e.index < 0 || e.index > 255 ) {
        console.error('index fora da faixa. ' + e.index);
        return;
    }
    if ( e.value < 0 || e.value > 255 ) {
        console.error('value fora da faixa. ' + e.value);
        return;
    }
    if ( state.dmx.conectado )
        dmx.update('main',{[e.index]: e.value});
    setState({
        ...state,
        canais: {
            ...state.canais,
            [e.index]: e.value
        }
    })
});

on('salvar-cena',({uid}:{uid:number})=>{
    const save = {};
    for(let c=1;c<=255;c++){
        save[c] = state.canais[c]||0
    }
    const cenaIndex = state.cenas.findIndex((cena)=>cena.uid == uid);
    const cena = state.cenas[cenaIndex];
    setState({
        ...state,
        cenas: [
            ...state.cenas.filter((_:any,index:number) => index < cenaIndex ),
            {
                ...cena,
                canais: save
            },
            ...state.cenas.filter((_:any,index:number)=> index > cenaIndex )
        ]
    });
});

on('salvar-mesa',({nome}:{nome:string})=>{
    const save = {};
    for(let c=1;c<=255;c++){
        save[c] = state.canais[c]||0
    }
    setState({
        ...state,
        cenas: [
            ...state.cenas,
            {
                transicaoTempo: 0,
                nome,
                uid: uidCount++,
                tipo: 'mesa',
                canais: save
            }
        ]
    })
});

on('editar-nome-da-cena',({uid,nome}:{uid:number,nome:string})=>{
    const cenaIndex = state.cenas.findIndex((cena)=>cena.uid == uid);
    const cena = state.cenas[cenaIndex] as Cena;
    setState({
        ...state,
        cenas: [
            ...state.cenas.filter((_:any,index:number) => index < cenaIndex ),
            {
                ...cena,
                nome
            },
            ...state.cenas.filter((_:any,index:number)=> index > cenaIndex )
        ]
    });
});

on('editar-tempo-da-cena',({uid,tempo}:{uid:number,tempo:number})=>{
    const cenaIndex = state.cenas.findIndex((cena)=>cena.uid == uid);
    const cena = state.cenas[cenaIndex] as Cena;
    setState({
        ...state,
        cenas: [
            ...state.cenas.filter((_:any,index:number) => index < cenaIndex ),
            {
                ...cena,
                transicaoTempo: tempo
            },
            ...state.cenas.filter((_:any,index:number)=> index > cenaIndex )
        ]
    });
});

// let canaisPrecisos:any = null;
on('aplicar-cena-agora',({uid}:{uid:number})=>{
    // canaisPrecisos = null;
    const cena = state.cenas.find((cena)=>cena.uid == uid) as Cena;
    if ( state.dmx.conectado )
        dmx.update('main',cena.canais);
    setState({
        ...state,
        canais: cena.canais,
        ultimaCena: cena.uid,
        animacao: false
    });
});
let animacao:{
    de: Date,
    ate: Date,
    cena: number,
    canaisIniciais: {[key:number]:number}
}| null = null;
on('transicao-para-cena',({uid}:{uid:number})=>{
    // canaisPrecisos = null;
    const cena = state.cenas.find((cena)=>cena.uid == uid) as Cena;
    const tempo = cena.transicaoTempo;
    if ( tempo ) {
        const de = new Date;
        const ate = new Date;
        ate.setTime(de.getTime() + parseInt(tempo+''));
        animacao = {
            de,
            cena: cena.uid,
            ate,
            canaisIniciais: state.canais
        };
        setState({
            ...state,
            ultimaCena: cena.uid,
            animacao: true
        });
    } else {
        if ( state.dmx.conectado )
            dmx.update('main',cena.canais);
        animacao = null;
        setState({
            ...state,
            canais: cena.canais,
            ultimaCena: cena.uid,
            animacao: false
        })
    }
});

const intervalTime = 100;
const animationInterval = setInterval(()=>{
    if ( animacao ) {
        // const animacao = state.animacao;
        const now = new Date;
        const cena = state.cenas.find(c=>c.uid == (animacao as any).cena) as Cena;
        const passouTime = now.getTime() - animacao.de.getTime();
        const totalTime = animacao.ate.getTime() - animacao.de.getTime();
        if ( passouTime > totalTime ) {
            // canaisPrecisos = null;
            animacao = null;
            setState({
                ...state,
                animacao: false,
                canais: cena.canais
            });
            if ( state.dmx.conectado )
                dmx.update('main',cena.canais);
            return;
        }
        const canais = {...state.canais};
        for ( const index in canais ) {
            // const valorAtual = canais[index];
            const valorInicial = animacao.canaisIniciais[index];
            const valorObjetivo = cena.canais[index];
            const proximoValor = valorInicial + ( valorObjetivo - valorInicial ) * passouTime / totalTime;
            // canaisPrecisos[index] = proximoValor;
            canais[index] = Math.round(proximoValor);
        }
        if ( state.dmx.conectado )
          dmx.update('main',canais);
        setState({
            ...state,
            canais
        });
    }
},intervalTime );

on('new-screen-request',(args:any)=> {
    if ( state.window.criada )
        throw 'Já existe janela.';
    if ( state.window.criando )
        throw 'Já está sendo criada.';
    setState({
        ...state,
        window: {
            criando: true,
            criada: false
        }
    });
    const id = args.id,
        electron = require('electron'),
        display = electron.screen.getAllDisplays().filter(d => d.id == id)[0];
    if (!screen) {
        screen = new BrowserWindow({
            webPreferences: {
                nodeIntegrationInWorker: true
            },
            width: display.workArea.width,
            height: display.workArea.height,
            x: display.workArea.x,
            y: display.workArea.y
        });
        screen.setMenu(null);
        screen.setFullScreen(true);
        // screen.setResizable(false);
        screen.loadURL(`file://${__dirname}/screen.html`);
        screen.on('closed', () => {
            screen = null;
            screenSender = null;
            appSender = null;
            setState({
                ...state,
                window: {
                    ...state.window,
                    criando: false,
                    criada: false
                }
            })
        });
        screen.webContents.openDevTools();
    } else {
        screen.setPosition( display.workArea.x, display.workArea.y );
        screen.setSize( display.workArea.width, display.workArea.height );
        screen.setFullScreen(true);
    }
});

export function close(){
    clearInterval(animationInterval);
    appSender = null;
    if ( screen ) {
        screen.close();
        screen = null;
    }
}
