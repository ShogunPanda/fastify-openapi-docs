/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  FastifyError,
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
  RouteOptions
} from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import yaml from 'js-yaml'
import { buildSpec, Schema } from './spec.js'
import { addUI } from './ui.js'

export const plugin = fastifyPlugin(
  function (instance: FastifyInstance, options: FastifyPluginOptions, done: (error?: FastifyError) => void): void {
    let prefix = options.prefix ?? '/docs'
    let spec: Schema = options.openapi ?? {}
    const routes: Array<RouteOptions> = []

    if (prefix.indexOf('/') !== 0) {
      prefix = `/${prefix}`
    }

    if (!options.skipUI) {
      addUI(instance, prefix)
    }

    // Register spec routes
    instance.route({
      method: 'GET',
      url: `${prefix}/openapi.yaml`,
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.type('text/yaml')
        reply.send(yaml.dump(spec))
      },
      config: { hide: false }
    })

    instance.route({
      method: 'GET',
      url: `${prefix}/openapi.json`,
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send(spec)
      },
      config: { hide: false }
    })

    // Utility to track all the RouteOptions we add
    instance.addHook('onRoute', route => {
      if (route.path.startsWith(prefix)) {
        return
      }

      routes.push(route)
    })

    // When the server starts, add all schemas and routes to the spec
    instance.addHook('onReady', done => {
      spec = buildSpec(instance, spec, instance.getSchemas() as { [key: string]: Schema }, routes)
      done()
    })

    done()
  },
  { name: 'fastify-openapi-docs', fastify: '4.x' }
)

export default plugin
