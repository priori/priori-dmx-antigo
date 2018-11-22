const DMX = require("dmx"),
  dmx = new DMX();

export function connect(driver: string, deviceId: string) {
    try {
        dmx.addUniverse("main", driver, deviceId);
    }catch (e) {
        console.error("DMX connect",e && e.stack ? e.stack : e );
    }
}

export function update(canais: { [key: number]: number }) {
    try {
        dmx.update("main", canais);
    }catch (e) {
        console.error("DMX update",e && e.stack ? e.stack : e );
    }
}

export function close() {
  try {
      dmx.universes.main.close();
  }catch (e) {
      console.error("DMX close",e && e.stack ? e.stack : e );
  }finally {
      delete dmx.universes.main;
  }
}
