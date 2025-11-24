import {
  type FastifyError,
  type FastifyInstance,
  type FastifyPluginOptions,
  type FastifyReply,
  type FastifyRequest,
  type RouteOptions
} from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { dump } from 'js-yaml'
import { buildSpec, type Schema } from './spec.ts'
import { addUI } from './ui.ts'

export const plugin = fastifyPlugin(
  function (instance: FastifyInstance, options: FastifyPluginOptions, done: (error?: FastifyError) => void): void {
    let prefix: string = options.prefix ?? '/docs'
    let spec: Schema = options.openapi ?? {}
    const routes: RouteOptions[] = []

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
        reply.send(dump(spec))
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
      spec = buildSpec(instance, spec, instance.getSchemas() as Record<string, Schema>, routes)
      done()
    })

    done()
  },
  { name: 'fastify-openapi-docs', fastify: '5.x' }
)

export default plugin
