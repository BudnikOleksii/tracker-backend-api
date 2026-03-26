import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject, SwaggerCustomOptions } from '@nestjs/swagger';

import { ProblemDetailsDto } from '@/shared/dtos/problem-details.dto.js';

export const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
};

function addDefaultErrorResponses(document: OpenAPIObject): void {
  if (!document.paths) {
    return;
  }

  for (const path in document.paths) {
    const pathItem = document.paths[path];
    if (!pathItem) {
      continue;
    }

    for (const method in pathItem) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
        continue;
      }

      const operation = pathItem[method as keyof typeof pathItem];
      if (!operation || typeof operation !== 'object' || !('responses' in operation)) {
        continue;
      }

      if (operation.responses && !operation.responses.default) {
        operation.responses.default = {
          description: 'Error response (includes 400/401/403/404/422/429/500, etc.)',
          content: {
            'application/problem+json': {
              schema: {
                $ref: '#/components/schemas/ProblemDetailsDto',
              },
            },
          },
        };
      }
    }
  }
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Tracker API')
    .setDescription('Tracker Backend API documentation')
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Development')
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Audit Logs', 'Audit log endpoints')
    .addTag('Transactions', 'Transaction management endpoints')
    .addTag('Transaction Categories', 'Transaction category management endpoints')
    .addTag('Budgets', 'Budget management endpoints')
    .addTag('Recurring Transactions', 'Recurring transaction management endpoints')
    .addTag('Transactions Analytics', 'Transaction analytics and reporting endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [],
    deepScanRoutes: true,
    extraModels: [ProblemDetailsDto],
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  addDefaultErrorResponses(document);

  SwaggerModule.setup('swagger', app, document, {
    ...swaggerCustomOptions,
    yamlDocumentUrl: '/openapi.yaml',
  });

  app.use(
    '/docs',
    apiReference({
      content: document,
    }),
  );
}
