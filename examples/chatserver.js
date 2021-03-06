// Generated by SugarLisp v0.6.5
var net = require("net");
var chatServer = net.createServer();
var port = 3000;
var clientList = [];
var broadcast = function(message, client) {
  return clientList.forEach(function(currentClient) {
    if ((currentClient != client)) {
      currentClient.write([client.name, " says ", message].join(''))
    };
  });
};
chatServer.on("connection", function(client) {
  client.name = [client.remoteAddress, ":", client.remotePort].join('');
  client.write(["Hi ", client.name, "\n"].join(''));
  clientList.push(client);
  client.on("data", function(data) {
    return broadcast(data, client);
  });
  return client.on("end", function() {
    return clientList.splice(clientList.indexOf(client), 1);
  });
});

chatServer.listen(port);

console.log("Listening...");
console.log("(telnet to port 3000 to chat)");