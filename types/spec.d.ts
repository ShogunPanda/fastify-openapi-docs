import { FastifyInstance, RouteOptions } from 'fastify';
export interface Schema {
    [key: string]: any;
}
export declare function buildSpec(instance: FastifyInstance, spec: Schema, schemas: {
    [key: string]: Schema;
}, routes: Array<RouteOptions>): Schema;
