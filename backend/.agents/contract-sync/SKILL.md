---
name: contract-sync
description: Procedimento obrigatório para sincronização de contratos OpenAPI/Swagger e desenvolvimento frontend com tipagem estrita (Zero Any).
---

# Procedimento: Sincronização de Contratos e Desenvolvimento Orientado a Tipos

Este procedimento garante que nenhuma chamada de API no front-end utilize `as any`, `as unknown` ou mocks desconectados.

---

## 1. Regra Fundamental: Zero `any` / Zero `unknown`
- O cliente HTTP do front-end (`client` de `src/services/api.ts`) utiliza `openapi-fetch`.
- `client.GET(endpoint)` e `client.POST(endpoint)` exigem que o endpoint e seus tipos existam em `src/api/schema.ts`.
- **NUNCA** use `as any` no endpoint ou `as unknown as Type` no `response.data`.
- Se o TypeScript reclamar que a rota não existe em `paths` ou que `data` é `undefined`, o problema **está no backend ou no schema desatualizado**, e deve ser corrigido na fonte.

---

## 2. Fluxo Passo a Passo: Criando ou Consumindo Rotas

### Passo 2.1: No Back-end (NestJS + Zod + Swagger)
1. Crie o schema Zod e o DTO de resposta usando `createZodDto`:
   ```typescript
   export const MinhaRespostaSchema = z.object({ ... });
   export class MinhaRespostaDto extends createZodDto(MinhaRespostaSchema) {}
   ```
2. No controller, decore o endpoint obrigatoriamente com o DTO tipado:
   ```typescript
   @Get('meu-endpoint')
   @ApiOkResponse({
     type: MinhaRespostaDto,
     description: 'Descrição do retorno',
   })
   async meuMetodo() { ... }
   ```
3. Valide o build do backend:
   ```bash
   npm run build  # Dentro de rpg-backend
   ```

### Passo 2.2: Sincronizar o `schema.ts` no Front-end
1. Com a rota documentada no Swagger, atualize o arquivo `rpg-frontend/src/api/schema.ts` com as novas definições de `paths`, `operations` e `components["schemas"]`.

### Passo 2.3: Consumir no Front-end com Inferência Automática Pura
1. Importe os tipos diretamente do schema:
   ```typescript
   import type { components } from '../api/schema';
   export type MinhaResposta = components['schemas']['MinhaRespostaDto'];
   ```
2. Realize a chamada sem NENHUM `as`:
   ```typescript
   const { data, error } = await client.GET('/meu-endpoint');
   if (error || !data) {
     throw new Error('Falha na requisição');
   }
   // 'data' já possui tipagem 100% perfeita inferida pelo TypeScript!
   return data;
   ```

### Passo 2.4: Verificação de Tipos Obrigatória
Execute no diretório `rpg-frontend`:
```bash
npm run lint  # Executa tsc --noEmit
```
O comando DEVE terminar com código 0.
