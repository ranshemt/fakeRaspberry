const appIP = "192.168.68.102";
const appPort = 2222;
const telemetryInterval = 1000;
//
//
//
var udp = require("dgram");
// creating a udp server
var server = udp.createSocket("udp4");
console.log(Date.now());
// emits when any error occurs
server.on("error", function (error) {
  console.log("Error: " + error);
  server.close();
});
// emits on new datagram msg
server.on("message", async function (msg, info) {
  console.log("Data received from client : " + msg.toString());
  console.log(
    "Received %d bytes from %s:%d\n",
    msg.length,
    info.address,
    info.port
  );
  /**
   * emit every 0.5 second
   */
  let allTelemetryInterval = null;
  if (allTelemetryInterval) clearInterval(allTelemetryInterval);
  allTelemetryInterval = setInterval(() => allTelemetry(server), telemetryInterval);
  /**
   * fromClient
   */
  const M = JSON.parse(msg.toString());
  if (M.type === "fromClient") {
    console.log(`clientData from client = ${M.data}`);
  }
  /**
   * navigateTo
   */
  if (M.type === "navigateTo") {
    console.log(
      `request from client to navigate drone to ${JSON.stringify(M, null, 2)}`
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
    const msgToSend = Buffer.from(
      JSON.stringify({
        type: "navFinished",
        status: isSuccess,
        startTime,
        finishTime,
        navigationTime: waitTime,
        targetCoordinate: M.targetCoordinate,
        totalDistance: isSuccess
          ? M.dstDiagonalCM
          : getRandomInt(10, 100),
        reachedCoordinate: isSuccess
          ? M.targetCoordinate
          : {
              lat: getRandomInt(200, 500),
              lon: getRandomInt(200, 500),
            },
        reasons,
      })
    );
    server.send(msgToSend, appPort, appIP, (err) => {
      if (err) {
        console.log("ERROR sending data: " + err);
      }
    });
  }
});
//emits when socket is ready and listening for datagram msgs
server.on("listening", function () {
  var address = server.address();
  var port = address.port;
  var family = address.family;
  var ipaddr = address.address;
  console.log("Server is listening at port" + port);
  console.log("Server ip :" + ipaddr);
  console.log("Server is IP4/IP6 : " + family);
});
//emits after the socket is closed using socket.close();
server.on("close", function () {
  console.log("Socket is closed !");
});
server.bind(2222);
//
//
let emergencyEventFinishTime = -1;
const minHeight = 2;
const maxHeight = 100;
const emergencyHeight = 10;
function allTelemetry(server) {
  if (!server) return;
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
    console.log(
      `emergency event starts now and should end in ${emergencyTime} which is ${
        emergencyTime / 1000
      } seconds`
    );
  }
  if (Date.now() <= emergencyEventFinishTime && altitude > emergencyHeight) {
    altitude = getRandomInt(minHeight, emergencyHeight);
  }
  console.log(`altitude = ${altitude}`);
  if (
    emergencyEventFinishTime !== -1 &&
    Date.now() > emergencyEventFinishTime
  ) {
    emergencyEventFinishTime = -1;
    console.log("emergency event finished");
  }
  //
  const msgToSend = Buffer.from(
    JSON.stringify({
      type: "allTelemetry",
      time: Date.now(),
      batStatus,
      wifiSignal,
      latitude,
      longitude,
      altitude,
      bearing,
    })
  );
  server.send(msgToSend, appPort, appIP, (err) => {
    if (err) {
      console.log("ERROR sending data: " + err);
    }
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
