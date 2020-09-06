"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAndReturnAsPromise = void 0;
var sequelize_1 = require("sequelize");
function queryAndReturnAsPromise(connection, query, parameters) {
    var pms = {
        bind: Object.keys(parameters).length > 1 ?
            Object.assign({}, parameters, { query: null }) :
            undefined,
        type: sequelize_1.QueryTypes.SELECT
    };
    return connection.query(query, pms);
}
exports.queryAndReturnAsPromise = queryAndReturnAsPromise;
//# sourceMappingURL=util.js.map