"use strict";
/* eslint-disable @typescript-eslint/no-floating-promises */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUI = void 0;
const fastify_static_1 = __importDefault(require("fastify-static"));
const fs_1 = require("fs");
const path_1 = require("path");
const swagger_ui_dist_1 = require("swagger-ui-dist");
function addUI(instance, prefix) {
    // Get the main index file and patch it
    const swaggerUIRoot = swagger_ui_dist_1.getAbsoluteFSPath();
    const swaggerUIRootIndex = fs_1.readFileSync(path_1.resolve(swaggerUIRoot, 'index.html'), 'utf8').replace(/url: "(.*)"/, `url: "${prefix}/openapi.json"`);
    // Add the Swagger UI
    instance.route({
        method: 'GET',
        url: prefix,
        handler(_, reply) {
            reply.redirect(301, `${prefix}/`);
        }
    });
    instance.register(fastify_static_1.default, {
        root: swaggerUIRoot,
        prefix,
        schemaHide: true,
        decorateReply: false
    });
    // This hook is required because we have to serve the patched index file in order to point to the local documentation
    // eslint-disable-next-line no-useless-escape
    const indexUrl = new RegExp(`^(?:${prefix.replace(/\//g, '\\/')}\/(?:index\.html)?)$`);
    instance.addHook('preHandler', (request, reply, done) => {
        if (request.raw.url.match(indexUrl)) {
            reply.header('Content-Type', 'text/html; charset=UTF-8');
            reply.send(swaggerUIRootIndex);
        }
        done();
    });
}
exports.addUI = addUI;
