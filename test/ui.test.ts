/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-floating-promises */

import fastify from 'fastify'
import t from 'tap'
import { plugin as fastifyOpenApiDocs } from '../src'

type Test = typeof t

t.test('UI serving', (t: Test) => {
  t.test('should serve the UI by default', async (t: Test) => {
    const server = fastify()

    server.register(fastifyOpenApiDocs, {})

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/docs')
    const { body: defaultBody } = await server.inject('/docs/')
    const { body: indexBody } = await server.inject('/docs/index.html')

    t.equal(redirectStatus, 301)
    t.equal(redirectBody, '')
    t.true(defaultBody.indexOf('url: "/docs/openapi.json",') > 0)
    t.true(indexBody.indexOf('url: "/docs/openapi.json",') > 0)
    t.equal(defaultBody, indexBody)
  })

  t.test('should not serve the UI if requested to', async (t: Test) => {
    const server = fastify()

    server.register(fastifyOpenApiDocs, { skipUI: true })

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/docs')
    const { statusCode: defaultStatus, body: defaultBody } = await server.inject('/docs/')
    const { statusCode: indexStatus, body: indexBody } = await server.inject('/docs/index.html')

    t.equal(redirectStatus, 404)
    t.equal(defaultStatus, 404)
    t.equal(indexStatus, 404)
    t.equal(redirectBody, '{"message":"Route GET:/docs not found","error":"Not Found","statusCode":404}')
    t.equal(defaultBody, '{"message":"Route GET:/docs/ not found","error":"Not Found","statusCode":404}')
    t.equal(indexBody, '{"message":"Route GET:/docs/index.html not found","error":"Not Found","statusCode":404}')
  })

  t.test('should respect the right prefix', async (t: Test) => {
    const server = fastify()

    server.register(fastifyOpenApiDocs, { prefix: 'another' })

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/another')
    const { body: defaultBody } = await server.inject('/another/')
    const { body: indexBody } = await server.inject('/another/index.html')

    t.equal(redirectStatus, 301)
    t.equal(redirectBody, '')
    t.true(defaultBody.indexOf('url: "/another/openapi.json",') > 0)
    t.true(indexBody.indexOf('url: "/another/openapi.json",') > 0)
    t.equal(defaultBody, indexBody)
  })

  t.test('should allow multiple instances', async (t: Test) => {
    const server = fastify()

    server.register(fastifyOpenApiDocs, { prefix: 'v1' })
    server.register(fastifyOpenApiDocs, { prefix: 'v2' })

    const { statusCode: redirectStatus, body: redirectBody } = await server.inject('/v1')
    const { body: defaultBody } = await server.inject('/v1/')
    const { body: indexBody } = await server.inject('/v1/index.html')

    const { statusCode: redirectStatusv2, body: redirectBodyv2 } = await server.inject('/v2')
    const { body: defaultBodyv2 } = await server.inject('/v2/')
    const { body: indexBodyv2 } = await server.inject('/v2/index.html')

    t.equal(redirectStatus, 301)
    t.equal(redirectBody, '')
    t.true(defaultBody.indexOf('url: "/v1/openapi.json",') > 0)
    t.true(indexBody.indexOf('url: "/v1/openapi.json",') > 0)
    t.equal(defaultBody, indexBody)
    t.equal(redirectStatusv2, 301)
    t.equal(redirectBodyv2, '')
    t.true(defaultBodyv2.indexOf('url: "/v2/openapi.json",') > 0)
    t.true(indexBodyv2.indexOf('url: "/v2/openapi.json",') > 0)
    t.equal(defaultBodyv2, indexBodyv2)
  })

  t.end()
})
