"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAndReturnAsPromise = void 0;
function queryAndReturnAsPromise(connection, query, parameters) {
    var pms = { type: connection.QueryTypes.SELECT, bind: null };
    if (Object.keys(parameters).length > 1) {
        pms.bind = Object.assign({}, parameters);
        Reflect.deleteProperty(pms.bind, "query");
    }
    return connection.query(query, pms);
}
exports.queryAndReturnAsPromise = queryAndReturnAsPromise;
//# sourceMappingURL=util.js.map