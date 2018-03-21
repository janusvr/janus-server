modules.exports = {create}

function makeHandler(updateFn) {
    return {
        set: function(obj, prop, val) {
            obj[prop] = val;
            updateFn();
        },
        deleteProperty: function(obj, prop) {
            delete obj[prop];
            updateFn();
        }
    };
}

function createProxied(updateFn) {
    return new Proxy({}, makeHandler(updateFn));
}
