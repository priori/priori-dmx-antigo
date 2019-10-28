const http = require("http");

for (let c = 1; c < 255; c++) {
  const index = c;
  http
    .get("http://192.168.137." + c + "/", () => console.log(index))
    .on("error", () => {});
}
