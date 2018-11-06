const DMX = require("dmx"),
  dmx = new DMX();

export function connect(driver: string, deviceId: string) {
  dmx.addUniverse("main", driver, deviceId);
}

export function update(canais: { [key: number]: number }) {
  dmx.update("main", canais);
}

export function close() {
  dmx.universes.main.close();
  delete dmx.universes.main;
}
