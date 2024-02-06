/* eslint-disable @typescript-eslint/no-floating-promises */

import fastify from 'fastify'
import { deepStrictEqual, ok } from 'node:assert'
import { test } from 'node:test'
import { plugin as fastifyOpenApiDocs } from '../src/index.js'

test('UI serving', async () => {
  await test('should serve the UI by default', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {})

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/docs')
    const { body: initializerBody } = await server.inject('/docs/swagger-initializer.js')

    deepStrictEqual(redirectStatus, 301)
    deepStrictEqual(redirectBody, '')
    ok(initializerBody.indexOf('url: "/docs/openapi.json",') > 0)
  })

  await test('should not serve the UI if requested to', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, { skipUI: true })

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/docs')
    const { statusCode: defaultStatus, body: defaultBody } = await server.inject('/docs/')
    const { statusCode: indexStatus, body: indexBody } = await server.inject('/docs/index.html')

    deepStrictEqual(redirectStatus, 404)
    deepStrictEqual(defaultStatus, 404)
    deepStrictEqual(indexStatus, 404)
    deepStrictEqual(redirectBody, '{"message":"Route GET:/docs not found","error":"Not Found","statusCode":404}')
    deepStrictEqual(defaultBody, '{"message":"Route GET:/docs/ not found","error":"Not Found","statusCode":404}')
    deepStrictEqual(
      indexBody,
      '{"message":"Route GET:/docs/index.html not found","error":"Not Found","statusCode":404}'
    )
  })

  await test('should respect the right prefix', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, { prefix: 'another' })

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/another')
    const { body: initializerBody } = await server.inject('/another/swagger-initializer.js')

    deepStrictEqual(redirectStatus, 301)
    deepStrictEqual(redirectBody, '')
    ok(initializerBody.indexOf('url: "/another/openapi.json",') > 0)
  })

  await test('should allow multiple instances', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, { prefix: 'v1' })
    await server.register(fastifyOpenApiDocs, { prefix: 'v2' })

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/v1')
    const { body: initializerBodyV1 } = await server.inject('/v1/swagger-initializer.js')

    const { statusCode: redirectStatusv2, body: redirectBodyv2 } = await server.inject('/v2')
    const { body: initializerBodyV2 } = await server.inject('/v2/swagger-initializer.js')

    deepStrictEqual(redirectStatus, 301)
    deepStrictEqual(redirectBody, '')
    ok(initializerBodyV1.indexOf('url: "/v1/openapi.json",') > 0)

    deepStrictEqual(redirectStatusv2, 301)
    deepStrictEqual(redirectBodyv2, '')
    ok(initializerBodyV2.indexOf('url: "/v2/openapi.json",') > 0)
  })

  await test('should respect ignoreTrailingSlash option', async () => {
    {
      const server = fastify({ ignoreTrailingSlash: false })

      await server.register(fastifyOpenApiDocs, {})

      const initialRequest = await server.inject('/docs')

      deepStrictEqual(initialRequest.statusCode, 301)
      deepStrictEqual(initialRequest.body, '')
      deepStrictEqual(initialRequest.headers.location, '/docs/')

      const redirectedRequest = await server.inject('/docs/')
      deepStrictEqual(redirectedRequest.statusCode, 200)
    }

    {
      const server = fastify({ ignoreTrailingSlash: true })

      await server.register(fastifyOpenApiDocs, {})

      const initialRequest = await server.inject('/docs')

      deepStrictEqual(initialRequest.statusCode, 301)
      deepStrictEqual(initialRequest.body, '')
      deepStrictEqual(initialRequest.headers.location, '/docs/index.html')
    }

    {
      const server = fastify({ ignoreTrailingSlash: true })

      await server.register(fastifyOpenApiDocs, {})

      const initialRequest = await server.inject('/docs/')

      deepStrictEqual(initialRequest.statusCode, 301)
      deepStrictEqual(initialRequest.body, '')
      deepStrictEqual(initialRequest.headers.location, '/docs/index.html')

      const redirectedRequest = await server.inject('/docs/index.html')
      deepStrictEqual(redirectedRequest.statusCode, 200)
    }
  })
})
