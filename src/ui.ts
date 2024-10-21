import fastifyStatic from '@fastify/static'
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getAbsoluteFSPath } from 'swagger-ui-dist'

export function addUI(instance: FastifyInstance, prefix: string): void {
  let indexUrl = `${prefix}/`

  if (instance.initialConfig.ignoreTrailingSlash) {
    indexUrl += 'index.html'
  }

  // Get the main index file and patch it
  const swaggerUIRoot = getAbsoluteFSPath()
  const swaggerUIInitializer = readFileSync(resolve(swaggerUIRoot, 'swagger-initializer.js'), 'utf8').replace(
    /url: "(.*)"/,
    `url: "${prefix}/openapi.json"`
  )

  // Add the Swagger UI
  instance.route({
    method: 'GET',
    url: prefix,
    handler(_: FastifyRequest, reply: FastifyReply): void {
      reply.redirect(indexUrl, 301)
    }
  })

  instance.register(fastifyStatic, {
    root: swaggerUIRoot,
    prefix,
    schemaHide: true,
    decorateReply: false
  })

  // This hook is required because we have to serve the patched index file in order to point to the local documentation
  // eslint-disable-next-line no-useless-escape
  const initializerUrl = new RegExp(`^(?:${prefix.replaceAll('/', '\\/')}\/swagger-initializer\\.js)$`)
  instance.addHook('preHandler', (request, reply, done) => {
    if (initializerUrl.test(request.raw.url!)) {
      reply.header('Content-Type', 'application/javascript; charset=UTF-8')
      reply.send(swaggerUIInitializer)
    }

    done()
  })
}
