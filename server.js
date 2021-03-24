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
//Store no of connected users
var users=0;
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

// chats updated by clients will be stored in this variable as collection of jsons
var chats=[{name : "Haya",msg:"Hello",time:1616584395815}];
//last update details will be stored here
var last_updates={};

function originIsAllowed(origin) {
    //all accepted domains
  if(origin=="http://localhost:3000" ||origin=="http://localhost:8080" || origin=="http://192.168.1.3:8080")
    return true;
  return false;
}

wsServer.on('request',async (request)=> {
    if (!originIsAllowed(request.origin)) {
        //Rejection of connection from other domains
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }
    var connection = request.accept('echo-protocol', request.origin);
    //Each user connect sucessfully
    users++;
    last_updates["users"]=new Date().getTime();//One use connected so last update is modified
    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', async function(message) {
        if (message.type === 'utf8') {
            var _data=JSON.parse(message.utf8Data);
            //whateever user had asked that itself initiated as response
            var response=_data;
            response["err"]=true;
            response["data"]=null;
            if(_data.action=="_updates"){
                //when ever user call request for updates last_updtaes is returned
                response["data"]=last_updates;
                response["err"]=false;
                connection.sendUTF(JSON.stringify(response));
            }
            else{
                if(_data.action=="add"){
                    //Adds data to chat 
                    chats.push(_data.json);
                    //Modifying last update
                    last_updates["chat_up"]=new Date().getTime();
                    //Chat length exceeds 50 will remove first chat
                    if(chats.length>50)
                        chats.shift();
                }
                else if(_data.action=="get"){
                    //Retuns chats
                    response["data"]=chats;
                    response["err"]=false;
                    connection.sendUTF(JSON.stringify(response));
                    
                }
                else if(_data.description=="getusers"){
                    //Reurn number of users connected to web socket
                    response["data"]=users;
                    response["err"]=false;
                    connection.sendUTF(JSON.stringify(response));
                }
                else if(_data.action=="delete"){
                    temp=[];
                    var deleted=false;
                    //Delete is invoked by time(TimeStamp) of chat inserted
                    for(i in chats){
                        if(chats[i].time==_data.json){
                            deleted=chats[i];
                            //Deletion also invokes changes in chats
                            last_updates["chat_up"]=new Date().getTime();
                        }
                        else{
                            //Other value is pushed to temp
                            temp.push(chats[i]);
                        }
                    }
                    chats=temp;
                    response["data"]=deleted;
                    connection.sendUTF(JSON.stringify(response));
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