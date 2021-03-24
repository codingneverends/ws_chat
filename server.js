var WebSocketServer = require('websocket').server;
var http = require('http');

const port=process.env.SERVER_PORT || 3002;

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port 3002');
});
var users=0;
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

var chats=[{name : "Haya",msg:"Hello",time:1616584395815}];
var last_updates={};

function originIsAllowed(origin) {
    //all accepted domains
  if(origin=="http://localhost:3000" ||origin=="http://localhost:8080" || origin=="http://192.168.1.3:8080")
    return true;
  return false;
}

wsServer.on('request',async (request)=> {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    var connection = request.accept('echo-protocol', request.origin);
    users++;
    last_updates["users"]=new Date().getTime();
    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', async function(message) {
        if (message.type === 'utf8') {
            var _data=JSON.parse(message.utf8Data);
            var regex=/^[a-zA-Z0-9]+(?:_[A-Za-z0-9]+)*$/;
            var response=_data;
            response["err"]=true;
            response["data"]=null;
            var update__=true;
            if(_data.updateto==undefined || _data.updateto==null || _data.updateto=="" || !_data.updateto.match(regex)){
                update__=false;
            }
            if(_data.action=="_updates"){
                response["data"]=last_updates;
                response["err"]=false;
                connection.sendUTF(JSON.stringify(response));
            }
            else{
                if(_data.action=="add"){
                    chats.push(_data.json);
                    last_updates["chat_up"]=new Date().getTime();
                    if(chats.length>50)
                        chats.shift();
                }
                else if(_data.action=="get"){
                    response["data"]=chats;
                    response["err"]=false;
                    connection.sendUTF(JSON.stringify(response));
                    
                }
                else if(_data.description=="getusers"){
                    response["data"]=users;
                    response["err"]=false;
                    connection.sendUTF(JSON.stringify(response));
                }
                else if(_data.action=="delete"){
                    temp=[];
                    var deleted=false;
                    for(i in chats){
                        if(chats[i].time==_data.json){
                            deleted=chats[i];
                        }
                        else{
                            temp.push(chats[i]);
                        }
                    }
                    chats=temp;
                    if(deleted){
                        last_updates["chat_up"]=new Date().getTime();
                    }
                }
                else{
                    response["error"]="Action is not resolved";
                    connection.sendUTF(JSON.stringify(response));
                }
            }
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close',async function(reasonCode, description) {
        console.log(reasonCode,description);
        users--;
        last_updates["users"]=new Date().getTime();
    });
});


module.exports = server;