
class WebSockets {
    _users = [];

    constructor(u) {
        _users = u;
    }

    connection(client) {
        // event fired when the chat room is disconnected
        client.on("disconnect", () => {
            _users = _users.filter((user) => user.socketId !== client.id);
        });
        
    }
}

let _users = [];
let _websocket = {};

init = () => {
    _websocket = new WebSockets(_users);
    return _websocket;
}

module.exports = {
    init
};