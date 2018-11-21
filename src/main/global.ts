import { screen} from "electron";

export function telasDisponiveis() {
    const telas = screen.getAllDisplays().map(d => ({
        width: d.size.width,
        height: d.size.height
    }));
    return telas;
}