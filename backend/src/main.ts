import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './modules/common/filters/all-exceptions.filter';
import { AppLoggerService } from './modules/observability/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  //Logger Estruturado de Observabilidade
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  //Parser de Cookies (Obrigatório para JWT e Refresh Token HttpOnly)
  app.use(cookieParser());

  //CORS com suporte a Cookies e credenciais
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });

  //Pipe de Validação Zod Global (Zero class-validator)
  app.useGlobalPipes(new ZodValidationPipe());

  //Filtro Global de Exceções (Anti-vazamento de banco de dados e formatação Zod)
  app.useGlobalFilters(new AllExceptionsFilter());

  //Documentação OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Logistics SaaS API Enterprise')
    .setDescription(
      'Documentação da API do ecossistema SaaS de Logística com Multi-Tenancy e RBAC',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o token JWT de acesso',
      },
      'bearer',
    )
    .addCookieAuth('jwt')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));

  const port = process.env.PORT;
  if (!port) {
    throw new Error('A variável de ambiente PORT não foi configurada.');
  }
  await app.listen(port, '0.0.0.0');
  logger.log(
    `🚀 Servidor rodando na porta ${port} (Swagger Docs em: /api/docs)`,
    'Bootstrap',
  );
}

void bootstrap();
