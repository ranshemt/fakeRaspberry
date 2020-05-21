const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 4001;
const index = require("./routes/index");
const app = express();
app.use(index);
const server = http.createServer(app);
const io = socketIo(server);
console.log(Date.now());
//
//
io.on("connection", (socket) => {
  //
  //
  console.log("New client connected");
  socket.on("fromClient", (clientData) => {
    console.log(`clientData from client = ${clientData}`);
  });
  //
  //
  let allTelemetryInterval = null;
  if (allTelemetryInterval) clearInterval(allTelemetryInterval);
  allTelemetryInterval = setInterval(() => allTelemetry(socket), 500);
  //
  //
  socket.on("navigateTo", async (navData) => {
    console.log(
      `request from client to navigate drone to ${JSON.stringify(
        navData,
        null,
        2
      )}`
    );
    const startTime = Date.now();
    //
    //fake navigation, sending commands to drone
    const waitTime = getRandomInt(3000, 7000);
    await sleep(waitTime);
    //
    //fake result, drone status / compare reached coordinate to target?
    const isSuccess = getRandomInt(0, 4); //this will be status from drone
    const reasons = [];
    if (!isSuccess) {
      for (let r = 1; r <= getRandomInt(1, 3); r++) {
        reasons.push(`reason number ${r}`);
      }
    }
    //
    //emit result to client
    const finishTime = Date.now();
    socket.emit("navFinished", {
      status: isSuccess,
      startTime,
      finishTime,
      navigationTime: waitTime,
      targetCoordinate: navData.targetCoordinate,
      totalDistance: isSuccess ? navData.dstDiagonalCM : getRandomInt(10, 100),
      reachedCoordinate: isSuccess
        ? navData.targetCoordinate
        : {
            lat: getRandomInt(200, 500),
            lon: getRandomInt(200, 500),
          },
      reasons,
    });
  });
});
//
let emergencyEventFinishTime = -1;
const minHeight = 2;
const maxHeight = 100;
const emergencyHeight = 10;
function allTelemetry(socket) {
  if (!socket) return;
  const batStatus = getRandomInt(0, 100);
  const wifiSignal = getRandomInt(0, 100);
  const latitude = getRandomInt(200, 500);
  const longitude = getRandomInt(200, 500);
  const bearing = getRandomInt(0, 360);
  //
  let altitude = getRandomInt(minHeight, maxHeight);
  if (emergencyEventFinishTime === -1 && altitude <= emergencyHeight) {
    const emergencyTime = getRandomInt(3000, 7000);
    emergencyEventFinishTime = Date.now() + emergencyTime;
    console.log(`emergency event starts now and should end in ${emergencyTime} which is ${emergencyTime / 1000} seconds`);
  }
  if (Date.now() <= emergencyEventFinishTime && altitude > emergencyHeight) {
    altitude = getRandomInt(minHeight, emergencyHeight);
  }
  console.log(`altitude = ${altitude}`);
  if (emergencyEventFinishTime !== -1 && Date.now() > emergencyEventFinishTime) {
    emergencyEventFinishTime = -1;
    console.log('emergency event finished');
  }
  //
  socket.emit("allTelemetry", {
    time: Date.now(),
    batStatus,
    wifiSignal,
    latitude,
    longitude,
    altitude,
    bearing,
  });
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
server.listen(port, () => console.log(`Listening on port ${port}`));
