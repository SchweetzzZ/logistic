# Plano de Implementação: Backend SaaS Multi-Tenant & Autenticação Segura (MySQL + Drizzle ORM)

Estruturação da camada de autenticação, controle de acesso (RBAC), multi-tenancy e infraestrutura do backend NestJS, utilizando **MySQL** com **Drizzle ORM**, e validação ponta a ponta com **Zod (`nestjs-zod`)**.

## Decisões Arquiteturais e Alinhamento

> [!TIP]
> **Multi-Tenancy & Usuário vinculado a uma única empresa:**  
> Cada usuário possui `tenantId` estrito como Foreign Key referenciando a tabela `tenants(id)` com chave estrangeira e índice único composto `(tenantId, email)`.  
> **Refresh Token:** Access Token (15m) + Refresh Token (7d) em cookies HttpOnly com hash bcrypt no banco e fallback por header Bearer para Swagger.

> [!TIP]
> **Onboarding & Criação de Colaboradores:**  
> 1. `POST /user/register`: Cria o **Tenant (Empresa)** e o primeiro usuário como **ADMIN** em uma única transação ACID no MySQL (`tx`).  
> 2. `POST /user`: Rota restrita (`@Roles(Role.ADMIN)`) onde o Administrador cadastra novos colaboradores (`MANAGER` ou `OPERATOR`), atribuindo automaticamente o `tenantId` da sessão do Admin logado.

---

## User Review Required

> [!IMPORTANT]
> - **Convenção de Pastas:** Cada módulo contém exatamente `service.ts`, `controller.ts`, `module.ts`, pasta `schemas/schema.ts` e pasta `dto/<entidade>.dto.ts`.
> - **Zero class-validator:** Todos os DTOs e validações são feitos exclusivamente via `nestjs-zod` e `zod`.
> - **Banco de Dados:** MySQL 8.0 via `drizzle-orm` e pool de conexões `mysql2/promise`.
> - **Isolamento de Tenant:** O `tenantId` é injetado no payload do JWT e acessado nos controllers/services via `@CurrentTenant()` e no usuário logado via `@CurrentUser()`.
> - **Dual Token Mechanism:** Cookies HttpOnly (`jwt` para access token e `refresh_token` para renovação) com suporte adicional a header `Authorization: Bearer <token>` para validação no Swagger OpenAPI `/api/docs`.

---

## Proposed Changes

### 1. Infraestrutura & Configuração (Tópico 1)

#### [MODIFY] [Docker-compose.yml](file:///c:/Users/schweetz/ProjetosDoWind/logistics-project/Docker-compose.yml)
- Configurar serviço MySQL 8.0 (`mysql:8.0`) na porta 3306 com volume persistente e credenciais para desenvolvimento local.

#### [NEW] [backend/.env.example](file:///c:/Users/schweetz/ProjetosDoWind/logistics-project/backend/.env.example) e [.env](file:///c:/Users/schweetz/ProjetosDoWind/logistics-project/backend/.env)
- Definir variáveis essenciais: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`, `CORS_ORIGIN`.

#### [NEW] [backend/drizzle.config.ts](file:///c:/Users/schweetz/ProjetosDoWind/logistics-project/backend/drizzle.config.ts)
- Configuração do Drizzle Kit com dialeto MySQL.

---

### 2. Bootstrap & Integração Zod / Swagger (Tópico 2)

#### [MODIFY] [backend/src/main.ts](file:///c:/Users/schweetz/ProjetosDoWind/logistics-project/backend/src/main.ts)
- Configurar `cookie-parser`.
- Configurar CORS com `credentials: true`.
- Configurar `ZodValidationPipe()` global.
- Configurar `AllExceptionsFilter`.
- Configurar documentação OpenAPI Swagger em `/api/docs` com pós-processamento `cleanupOpenApiDoc()`.

#### [MODIFY] [backend/src/app.module.ts](file:///c:/Users/schweetz/ProjetosDoWind/logistics-project/backend/src/app.module.ts)
- Importar `ConfigModule.forRoot({ isGlobal: true })`.
- Importar `DatabaseModule` global com Drizzle ORM.
- Registrar `CommonModule`, `TenantModule` e `UserModule`.

---

### 3. Camada Common & Segurança (Tópico 3)

#### [NEW] `backend/src/modules/common/enums/role.enum.ts`
- Definir `Role = { ADMIN = 'ADMIN', MANAGER = 'MANAGER', OPERATOR = 'OPERATOR' }`.

#### [NEW] `backend/src/modules/common/filters/all-exceptions.filter.ts`
- Filtro global de tratamento de exceções, formatação padronizada de erros do Zod, tratamento de duplicatas MySQL (`ER_DUP_ENTRY` / 1062) e prevenção contra vazamento de detalhes de banco.

#### [NEW] `backend/src/modules/common/decorators/current-user.decorator.ts` e `current-tenant.decorator.ts`
- Extração do usuário logado e do `tenantId` da requisição autenticada.

#### [NEW] `backend/src/modules/common/decorators/roles.decorator.ts` e `public.decorator.ts`
- Decorator `@Roles(...roles: Role[])` e `@Public()`.

#### [NEW] `backend/src/modules/common/guards/jwt-auth.guard.ts` e `roles.guard.ts`
- Validação do token JWT e verificação de papéis RBAC.

#### [NEW] `backend/src/modules/common/strategies/jwt.strategy.ts`
- Estratégia Passport JWT com extração dual (cookie HttpOnly `jwt` e Bearer Authorization).

#### [NEW] `backend/src/modules/common/common.module.ts`
- Módulo exportando Guards e provedores de segurança.

---

### 4. Camada de Banco de Dados Drizzle (`DatabaseModule`)

#### [NEW] `backend/src/modules/database/schema.ts`
- Exportação combinada dos schemas Drizzle do banco de dados.

#### [NEW] `backend/src/modules/database/database.module.ts`
- Pool de conexões `mysql2/promise`, instância do `DrizzleDB` injetável via token `DRIZZLE`, e auto-sincronização de tabelas no startup.

---

### 5. Módulo Tenant (Empresa)

#### [NEW] `backend/src/modules/tenant/schemas/schema.ts`
- Tabela Drizzle `tenants` (`id` UUID, `name`, `document` único, `status`, `createdAt`, `updatedAt`).

#### [NEW] `backend/src/modules/tenant/dto/tenant.dto.ts`
- Schemas Zod e DTOs (`createZodDto`) para Tenant com `id` (UUID).

#### [NEW] `backend/src/modules/tenant/service.ts`, `controller.ts`, `module.ts`
- Service com queries tipadas no Drizzle (`select`, `insert`, `update`).
- Controller exposto no Swagger para consulta e atualização dos dados da empresa logada.

---

### 6. Módulo User & Autenticação (Tópico 4)

#### [NEW] `backend/src/modules/user/schemas/schema.ts`
- Tabela Drizzle `users` com `id`, `name`, `email`, `passwordHash`, `role`, `tenantId` (FK referenciando `tenants.id`), `refreshTokenHash`, e índice único `(tenantId, email)`.

#### [NEW] `backend/src/modules/user/dto/user.dto.ts`
- DTOs Zod:
  - `RegisterTenantDto`: Empresa, documento/CNPJ, nome do admin, email, senha.
  - `CreateUserDto`: Criação de colaboradores por Admin (`name`, `email`, `password`, `role`).
  - `LoginDto`: Email e senha.
  - `UserResponseDto`: Dados do usuário expostos sem hash de senha.
  - `AuthResponseDto`: Usuário e access token.

#### [NEW] `backend/src/modules/user/service.ts`
- Auto-cadastro atômico em transação ACID Drizzle (`tx`).
- Hash e validação de senhas com `bcrypt`.
- Geração de pares Access Token + Refresh Token com rotação e revogação.

#### [NEW] `backend/src/modules/user/controller.ts`
- `POST /user/register`: Cadastro inicial (Tenant + Admin).
- `POST /user/login`: Login seguro injetando cookies HttpOnly (`jwt` e `refresh_token`).
- `POST /user/logout`: Limpeza dos cookies e invalidação do refresh token.
- `POST /user/refresh-token`: Renovação de tokens.
- `GET /user/me`: Dados do usuário autenticado.
- `POST /user`: Criação de membro da equipe pelo Admin (`@Roles(Role.ADMIN)`).
- `GET /user`: Listagem de colaboradores da mesma empresa.

#### [NEW] `backend/src/modules/user/module.ts`
- Registro de dependências e exportação do `UserService`.

---

## Verification Plan

### Automated Tests & Build
- Executar compilação com `npm run build` no diretório `backend` (garantindo código de saída 0 e sem erros de tipagem).
- Executar linter com `npm run lint`.

### Manual Verification
- Subir o container MySQL: `docker compose up mysql -d`.
- Iniciar o backend NestJS: `npm run start:dev`.
- Acessar Swagger em `http://localhost:3000/api/docs`.
- Validar fluxo de auth, registro de empresa, login com cookies HttpOnly, criação de colaboradores e renovação de tokens.
