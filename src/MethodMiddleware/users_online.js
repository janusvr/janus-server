function usersOnline(data, next) {
    var maxResults = config.maxUserResults;
    var count = 0;
    var results = Array();

    if(data.maxResults !== undefined && data.maxResults < maxResults) maxResults = data.maxResults;

    if(data.roomId === undefined) {
        // TODO
        for(k in this._server._userList) {
            results.push(k);
            count++;
            if(count >= maxResults) break;
        }
    }
    else {
        for(k in this._server._userList) {
            if(this._server._userList[k].roomId == data.roomId) {
                results.push([k]);
                count++;
                if(count >= maxResults) break;
            }
        }
    }

    json = { "results": count, "roomId": data.roomId, "users": results };
    this.send(this.makeMessage('users_online', json));
    return next();
}

module.exports = [usersOnline];

