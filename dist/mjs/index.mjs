import fastifyPlugin from 'fastify-plugin';
import yaml from 'js-yaml';
import { buildSpec } from "./spec.mjs";
import { addUI } from "./ui.mjs";
export const plugin = fastifyPlugin(function (instance, options, done) {
    var _a, _b;
    let prefix = (_a = options.prefix) !== null && _a !== void 0 ? _a : '/docs';
    let spec = (_b = options.openapi) !== null && _b !== void 0 ? _b : {};
    const routes = [];
    if (prefix.indexOf('/') !== 0) {
        prefix = `/${prefix}`;
    }
    if (!options.skipUI) {
        addUI(instance, prefix);
    }
    // Register spec routes
    instance.route({
        method: 'GET',
        url: `${prefix}/openapi.yaml`,
        handler(_, reply) {
            reply.type('text/yaml');
            reply.send(yaml.dump(spec));
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
        spec = buildSpec(instance, spec, instance.getSchemas(), routes);
        done();
    });
    done();
}, { name: 'fastify-openapi-docs' });
export default plugin;
// Fix CommonJS exporting
/* istanbul ignore else */
if (typeof module !== 'undefined') {
    module.exports = plugin;
    Object.assign(module.exports, exports);
}
