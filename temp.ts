import { FastifyReply, FastifyRequest } from 'fastify'

const server = require('fastify')()

server.register(require('./src'), {
  openapi: {
    // All these fields are optional, but they should be provided to satisfy OpenAPI specification.
    openapi: '3.0.3',
    info: {
      title: 'Title',
      description: 'Description',
      contact: {
        name: 'Shogun',
        url: 'https://cowtech.it',
        email: 'shogun@cowtech.it'
      },
      license: {
        name: 'ISC',
        url: `https://choosealicense.com/licenses/isc/`
      },
      version: '1.0.0'
    },
    servers: [
      { url: 'https://example.com', description: 'Production Server' },
      { url: 'https://dev.example.com', description: 'Development Server' }
    ],
    tags: [{ name: 'service', description: 'Service' }],
    components: {
      securitySchemes: {
        jwtBearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
})

server.addSchema({
  type: 'object',
  $id: '#request',
  description: 'The request payload',
  properties: {
    id: {
      type: 'string',
      description: 'The operation id',
      pattern: '^.+$',
      example: true
    }
  },
  required: ['id'],
  additionalProperties: false
})

server.addSchema({
  type: 'object',
  $id: '#response',
  description: 'The response payload',
  properties: {
    ok: {
      type: 'boolean',
      description: 'The operation response',
      example: true
    }
  },
  required: ['ok'],
  additionalProperties: false
})

server.route({
  method: 'POST',
  url: '/path',
  schema: {
    body: { $ref: '#request' },
    response: {
      200: { $ref: '#response' }
    }
  },
  config: {
    openapi: {
      description: 'Makes a request',
      summary: 'Main route',
      tags: ['service']
    }
  },
  handler(_: FastifyRequest, reply: FastifyReply): void {
    reply.send({ ok: true })
  }
})

server.listen(3000)
