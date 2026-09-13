---
name: nest-enterprise-scaffold
description: Guia mestre modular para criação e scaffold de backends Enterprise em NestJS + MongoDB + Zod + Cookies HttpOnly + Swagger, dividido em tópicos independentes e compatível com o comando /grill-me.
---

# 🏗️ NestJS Enterprise Scaffold: Blueprint Modular do Zero

Este documento é a especificação oficial para criar backends robustos, tipados de ponta a ponta e seguros com **NestJS**, **MongoDB (Mongoose)** e **Zod (`nestjs-zod`)**.

Ele é estruturado em **Tópicos Independentes**: você pode instruir o agente a executar tópicos específicos (ex: *"Execute apenas os Tópicos 1, 2 e 3"*) ou o projeto completo.

---

## 🎯 Protocolo de Alinhamento com `/grill-me`

Antes de escrever qualquer linha de código em um novo projeto, o agente DEVE acionar o modo de entrevista `/grill-me` para fazer 4 perguntas essenciais ao usuário:

1. **Domínio & Proposta de Valor:** Qual é o objetivo do sistema e quais são as 3 ou 4 entidades de negócio principais?
2. **Níveis de Acesso (Roles):** Quais serão os papéis de usuário (ex: `PLAYER` vs `ADMIN`, ou `USER` vs `MANAGER`)?
3. **Infraestrutura Local:** O banco será apenas MongoDB ou precisará de cache com Redis / mensageria?
4. **Quais Tópicos executar nesta sessão:** O scaffold deve ser completo (Tópicos 1 ao 7) ou focado em módulos específicos?

---

## 📑 Tópicos de Execução Modular

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [TÓPICO 1] Infraestrutura Docker & Variáveis (.env)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [TÓPICO 2] Dependências & Bootstrap (main.ts + Swagger + Zod)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [TÓPICO 3] Camada Common (Filtro Global + JWT Guard + @CurrentUser)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [TÓPICO 4] Módulo de Usuário & Autenticação Segura (HttpOnly Cookie)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [TÓPICO 5] Template de Nova Feature de Domínio (Mongoose + Zod)            │
├─────────────────────────────────────────────────────────────────────────────┤
│ [TÓPICO 6] Verificação & Build Obrigatório                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🐳 [TÓPICO 1] Infraestrutura Docker & Variáveis de Ambiente

### 1.1 Arquivo `docker-compose.yml`
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: app_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: rootpassword
      MONGO_INITDB_DATABASE: app_db
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### 1.2 Arquivo `.env.example`
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://root:rootpassword@localhost:27017/app_db?authSource=admin
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
```

---

## ⚡ [TÓPICO 2] Dependências & Bootstrap (`main.ts`)

### 2.1 Regra Absoluta: Zero `class-validator`
- **PROIBIDO:** Usar `class-validator` ou `class-transformer`.
- **OBRIGATÓRIO:** Utilizar `zod` e `nestjs-zod` para todos os DTOs de entrada e saída.

### 2.2 Pacotes Necessários
```bash
npm i @nestjs/mongoose mongoose @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt cookie-parser nestjs-zod zod @nestjs/swagger
npm i -D @types/bcrypt @types/cookie-parser @types/passport-jwt
```

### 2.3 Arquivo `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './modules/common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Parser de Cookies (Obrigatório para JWT HttpOnly)
  app.use(cookieParser());

  // 2. CORS com suporte a Cookies
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // 3. Integração Swagger com Zod
  patchNestJsSwagger();

  // 4. Pipe de Validação Zod Global
  app.useGlobalPipes(new ZodValidationPipe());

  // 5. Filtro Global de Exceções (Anti-vazamento de detalhes de banco)
  app.useGlobalFilters(new AllExceptionsFilter());

  // 6. Documentação OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('API Enterprise')
    .setDescription('Documentação dos contratos da API NestJS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Servidor rodando em http://localhost:${port}/api/docs`);
}
bootstrap();
```

---

## 🛡️ [TÓPICO 3] Camada Common & Segurança

### 3.1 Filtro Global de Exceções (`src/modules/common/filters/all-exceptions.filter.ts`)
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Erro interno do servidor';

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.getZodError().format();
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: message,
    });
  }
}
```

### 3.2 Decorator `@CurrentUser` (`src/modules/common/decorators/current-user.decorator.ts`)
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

### 3.3 Guard JWT (`src/modules/common/guards/jwt-guard.ts`)
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Sessão expirada ou não autorizada');
    }
    return user;
  }
}
```

---

## 👤 [TÓPICO 4] Módulo de Autenticação & Usuário (`/user`)

### 4.1 Regras Estritas de Auth
1. **Nunca retornar hash de senha** no retorno de `register`, `login` ou `me`.
2. **Cookie HttpOnly:** O endpoint `POST /user/login` DEVE injetar o cookie assinado `jwt`:
   ```typescript
   res.cookie('jwt', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 24 * 60 * 60 * 1000,
   });
   ```
3. O endpoint `POST /user/logout` limpa o cookie:
   ```typescript
   res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax' });
   ```

---

## 📦 [TÓPICO 5] Template de Nova Feature de Domínio

Ao criar qualquer módulo (ex: `Product`, `Order`, `Task`):

### Passo 1: Schema Mongoose (`src/modules/<nome>/schema/<nome>-schema.ts`)
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
```

### Passo 2: DTOs com Zod (`src/modules/<nome>/dto/<nome>-dto.ts`)
```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(3).max(100),
});

export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
export class UpdateTaskDto extends createZodDto(CreateTaskSchema.partial()) {}
```

### Passo 3: Controller Tipado com Swagger
```typescript
@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiCreatedResponse({ type: TaskResponseDto })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.create(userId, dto);
  }
}
```

---

## ✅ [TÓPICO 6] Verificação & Checklist Obrigatório

Antes de considerar qualquer entrega finalizada:
```bash
npm run build
```
- O build DEVE terminar com código 0.
- Nenhuma rota deve ficar sem `@ApiOkResponse` ou `@ApiCreatedResponse` com DTO documentado.
- Nenhum `class-validator` presente no `package.json`.
