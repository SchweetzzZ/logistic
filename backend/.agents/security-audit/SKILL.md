---
name: security-audit
description: Procedimento e checklist de auditoria de segurança para rotas, DTOs, autenticação e vazamento de dados no backend.
---

# Procedimento: Auditoria de Segurança no Backend

Sempre que auditar endpoints ou antes de fechar uma task de autenticação/API, execute este checklist:

## 1. Vazamento de Dados Sensíveis
- [ ] O método `register` retorna o hash de senha? (NUNCA deve retornar).
- [ ] O método `login` retorna apenas os dados essenciais e o token?
- [ ] O DTO de resposta filtra campos internos como `__v`, `password` e chaves privadas?
- [ ] O `AllExceptionsFilter` está ativo para mascarar erros internos do MongoDB e stack traces?

## 2. Proteção de Rotas e Autorização
- [ ] Toda rota que requer usuário autenticado possui `@UseGuards(JwtAuthGuard)`?
- [ ] O ID do usuário autenticado é obtido de forma segura via `@CurrentUser('sub')` e não via parâmetros não verificados no body ou query param (`userId`)?
- [ ] Rotas administrativas validam a role (`UserRole.ADMIN`) com guard específico de roles?

## 3. Prevenção de Escalação de Privilégios
- [ ] O DTO de cadastro (`RegisterUserDto`) permite que o cliente envie `role: "admin"`?
  - Regra: O endpoint público deve sempre forçar `role = UserRole.PLAYER` internamente.

## 4. Tratamento de Exceções e Validação
- [ ] O `ZodValidationPipe` está globalmente registrado no `main.ts`?
- [ ] O `AllExceptionsFilter` intercepta erros de validação e erros de chave duplicada (Mongo E11000)?
- [ ] Em produção, erros 500 retornam apenas uma mensagem genérica sem vazar comandos de banco ou paths do sistema operacional?
