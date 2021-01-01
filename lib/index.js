"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const js_yaml_1 = require("js-yaml");
const spec_1 = require("./spec");
const ui_1 = require("./ui");
exports.plugin = fastify_plugin_1.default(function (instance, options, done) {
    var _a, _b;
    let prefix = (_a = options.prefix) !== null && _a !== void 0 ? _a : '/docs';
    let spec = (_b = options.openapi) !== null && _b !== void 0 ? _b : {};
    const routes = [];
    if (prefix.indexOf('/') !== 0) {
        prefix = `/${prefix}`;
    }
    if (!options.skipUI) {
        ui_1.addUI(instance, prefix);
    }
    // Register spec routes
    instance.route({
        method: 'GET',
        url: `${prefix}/openapi.yaml`,
        handler(_, reply) {
            reply.type('text/yaml');
            reply.send(js_yaml_1.dump(spec));
        },
        config: { hide: false }
    });
    instance.route({
        method: 'GET',
        url: `${prefix}/openapi.json`,
        handler(_, reply) {
            reply.send(spec);
        },
        config: { hide: false }
    });
    // Utility to track all the RouteOptions we add
    instance.addHook('onRoute', (route) => {
        routes.push(route);
    });
    // When the server starts, add all schemas and routes to the spec
    instance.addHook('onReady', (done) => {
        spec = spec_1.buildSpec(instance, spec, instance.getSchemas(), routes);
        done();
    });
    done();
}, { name: 'fastify-openapi-docs' });
exports.default = exports.plugin;
module.exports = exports.plugin;
Object.assign(module.exports, exports);
