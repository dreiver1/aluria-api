# Referência da API Alúria

Esta referência foi conferida contra as rotas montadas em `src/app.js` e nos arquivos de `src/routes`. Há 43 endpoints registrados. Os exemplos usam dados fictícios. Onde o controller não define um contrato estável, a documentação registra o comportamento observado em vez de criar uma resposta idealizada.

## Convenções

- Base local: `http://localhost:3002`.
- Autenticado significa `Authorization: Bearer <JWT>`; o middleware atual valida assinatura e expiração, mas não verifica papel, permissão ou escopo.
- Os endpoints sem autenticação são explicitamente marcados.
- Não há query parameters implementados nas rotas registradas.
- Respostas de erro antigas frequentemente usam HTTP 200 e texto/objeto variável; isso é uma limitação conhecida.

### Login

`POST /admin/login` recebe `{ "email": "direcao@exemplo.edu.br", "senha": "SenhaFicticia123" }`. Sucesso: `200` com `{ message, token }`. Campos ausentes geram `400`; credenciais inválidas geram `401`; falha interna gera `500`. O JWT contém `id_usuario` e `email` e expira em duas horas.

### Cabeçalho protegido

```http
Authorization: Bearer eyJficticio...
```

Sem cabeçalho, o middleware retorna `401` com `{"message":"Login obrigatorio!"}`. Token inválido também retorna `401`.

## Administradores — `/admin`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `GET /admin/` | JWT; somente autenticação | Nenhum | `200`, array completo de `administradores` | Erro pode ser `200` com texto de erro; inclui `senha` no retorno atual. |
| `GET /admin/:id` | JWT; somente autenticação | `id` numérico; sem query/corpo | `200`, administrador completo | Usuário ausente retorna `200` com objeto `error`; inclui `senha`. |
| `POST /admin/` | JWT; não há autorização granular | JSON opcional: `nome`, `celular`, `email`, `cpf`, `dataNascimento`, `senha` | `200`, mensagem de cadastro | E-mail existente retorna `200`; erro de hash `500`; qualquer JWT pode criar outro administrador. |
| `PUT /admin/:id` | JWT; somente autenticação | `id` numérico; JSON: `nome`, `email`, `cpf`, `dataNascimento`, `celular` | `200`, registro atualizado | Ausente retorna `200` com `error`; resposta pode expor senha existente. |
| `DELETE /admin/:id` | JWT; somente autenticação | `id` numérico; sem corpo | `200`, registro removido | Ausente retorna `200`; não protege o último administrador e pode expor senha. |
| `POST /admin/login` | Público | JSON obrigatório: `email`, `senha` | `200`, mensagem e JWT | `400` campos ausentes; `401` credencial inválida; `500` falha interna. |

Exemplo:

```bash
curl -X POST http://localhost:3002/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"direcao@exemplo.edu.br","senha":"SenhaFicticia123"}'
```

## Professores — `/prof`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `POST /prof/` | JWT; somente autenticação | `nome`, `celular`, `email`, `cpf`, `dataNascimento`, `senha`, `administradores_idAdm`, opcional `id` | `200`, registro criado | `500` com texto em falha; o controller usa `administradores_idAdm`, ausente no schema atual; senha não é hash. |
| `GET /prof/` | JWT; somente autenticação | Nenhum | `200`, array completo | Erro pode ser `200` com erro; pode expor senha. |
| `GET /prof/:id` | JWT; somente autenticação | `id` string | `200`, professor | Ausente retorna `200` com `error`. |
| `PUT /prof/:id` | JWT; somente autenticação | `id`; `nome`, `email`, `cpf`, `dataNascimento`, `celular` | `200`, professor atualizado | Ausente retorna `200` com `error`. |
| `DELETE /prof/:id` | JWT; somente autenticação | `id`; sem corpo | `200`, professor removido | Ausente retorna `200`; pode expor senha. |

## Alunos — `/alunos`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `POST /alunos/` | JWT; somente autenticação | `nome`, `dataNascimento`, `email`, `cpf`, `celular`, `senha`, `professores_idprofessores`, `turmaId` | `200`, aluno criado | `500` com texto; senha é persistida sem hash e o retorno contém o registro. |
| `GET /alunos/` | JWT; somente autenticação | Nenhum | `200`, array de alunos | Pode retornar erro bruto em `200`; dados sensíveis são expostos. |
| `GET /alunos/:id` | JWT; somente autenticação | `id` string | `200`, aluno | Ausente retorna `200` com `error`; possível exposição de senha. |
| `GET /alunos/turma/:id` | JWT; somente autenticação | `id` da turma; sem query/corpo | `200`, array filtrado por `turmaId` | Em erro o controller apenas registra no console e a resposta pode ficar sem conclusão. |
| `PUT /alunos/:id` | JWT; somente autenticação | `id`; `nome`, `email`, `cpf`, `dataNascimento`, `celular`, `turmaId` | `200`, aluno atualizado | Ausente retorna `200`; não há verificação de escopo. |
| `DELETE /alunos/:id` | JWT; somente autenticação | `id`; sem corpo | `200`, aluno removido | Ausente retorna `200`; não há proteção de recurso nem escopo. |

## Turmas — `/turmas`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `POST /turmas/` | JWT; somente autenticação | Corpo consumido pelo controller de turma, principalmente `nome` e dados de professor | `200`/resposta do controller | O contrato depende do controller e há referências a relações legadas. |
| `POST /turmas/aluno` | JWT; somente autenticação | Corpo com identificadores de turma/aluno, `professoresIdprofessores` e `assignedBy` conforme o controller | Resposta do controller | Confia em campos enviados pelo cliente e referencia `alunosEmTurmas`, ausente no schema atual. |
| `GET /turmas/` | JWT; somente autenticação | Nenhum | `200`, lista de turmas | Falhas seguem o tratamento do controller. |
| `GET /turmas/:id` | JWT; somente autenticação | `id` | `200`, turma | Ausência/erro seguem o controller; não há escopo. |
| `PUT /turmas/:id` | JWT; somente autenticação | `id`; corpo de atualização da turma | `200`, turma atualizada | Sem autorização por papel ou vínculo. |
| `DELETE /turmas/:id` | JWT; somente autenticação | `id`; sem corpo | `200`, turma removida | Sem proteção contra exclusões indevidas. |

Os campos aceitos e os códigos exatos de criação/alteração variam no controller; não existe um schema HTTP formal separado.

## Frequência — `/frequencia`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `GET /frequencia/` | JWT; somente autenticação | Nenhum | `200`, lista | Tratamento depende do controller. |
| `GET /frequencia/:id` | JWT; somente autenticação | `id` | `200`, registro | Sem escopo por aluno/turma. |
| `GET /frequencia/aluno/:id` | JWT; somente autenticação | `id` do aluno | `200`, registros do aluno | IDOR possível para qualquer JWT. |
| `POST /frequencia/` | JWT; somente autenticação | Corpo do registro de frequência, conforme modelo/controller | Resposta do controller | Validação e status inconsistentes. |
| `PUT /frequencia/:id` | JWT; somente autenticação | `id`; corpo de atualização | Resposta do controller | Sem verificação de vínculo. |
| `DELETE /frequencia/:id` | JWT; somente autenticação | `id`; sem corpo | Resposta do controller | Sem escopo ou permissão de escrita. |

## Mês — `/mes`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `GET /mes/` | JWT; somente autenticação | Nenhum | `200`, lista | Formato depende do controller. |
| `GET /mes/:id` | JWT; somente autenticação | `id` | `200`, registro | Sem escopo. |
| `GET /mes/frequencia/:id` | JWT; somente autenticação | `id` de frequência | `200`, registros relacionados | IDOR possível. |
| `POST /mes/` | JWT; somente autenticação | Corpo do registro de mês | Resposta do controller | Validação e status não uniformes. |
| `PUT /mes/:id` | JWT; somente autenticação | `id`; corpo de atualização | Resposta do controller | Sem autorização de operação. |
| `DELETE /mes/:id` | JWT; somente autenticação | `id`; sem corpo | Resposta do controller | Sem escopo. |

## Notas — `/notas`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `GET /notas/` | JWT; somente autenticação | Nenhum | `200`, lista | Pode retornar erro serializado de modo inconsistente. |
| `GET /notas/:id` | JWT; somente autenticação | `id` | `200`, nota | Sem escopo por disciplina/turma. |
| `POST /notas/` | JWT; somente autenticação | Campos do modelo de nota, conforme controller | Resposta do controller | O controller referencia `turmaId`, que não existe no modelo Prisma atual. |
| `PUT /notas/:id` | JWT; somente autenticação | `id`; campos de nota | Resposta do controller | Qualquer JWT pode alterar a nota. |
| `DELETE /notas/:id` | JWT; somente autenticação | `id`; sem corpo | Resposta do controller | Sem permissão granular ou escopo. |

## Serviços — `/services`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `POST /services/auth` | Público | Corpo com `token` JWT | Token decodificado em sucesso | Token inválido pode ser refletido na mensagem de erro; não usar este endpoint como autorização. |

## Setup — `/setup`

| Método e caminho | Auth/autorização | Parâmetros e corpo | Sucesso observado | Erros/condições |
|---|---|---|---|---|
| `GET /setup/status` | Público | Nenhum | `200` com `{ configured, setupAvailable }` | Garante/atualiza o singleton `InstallationState`. Não retorna o código. |
| `POST /setup/bootstrap` | Público condicionado ao estado | JSON obrigatório: `code`, `nome`, `email`, `senha`; senha tem mínimo de 8 caracteres e e-mail é validado | `201` com mensagem de sucesso | `400` validação; `401` código inválido/expirado; `409` configurada; `429` bloqueada; `500` falha genérica. A transação cria apenas o primeiro administrador. |

Exemplo fictício:

```bash
curl -X POST http://localhost:3002/setup/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"code":"ABCD-EFGH-IJKL","nome":"Direção da Escola","email":"direcao@exemplo.edu.br","senha":"SenhaFicticia123"}'
```

O código é criado por `npm run setup-code`, fica somente em hash no banco, expira em 15 minutos, permite cinco tentativas e é invalidado ao concluir. A resposta nunca contém o código nem a senha.

## Rotas não registradas

`src/routes/alunosDependencies/parecer.js` existe como arquivo, mas está vazio e não é montado em `src/app.js`; portanto não é endpoint público e não entra na contagem de 43.

## Limitações conhecidas e segurança

Esta referência descreve o comportamento atual, inclusive falhas, para evitar que consumidores suponham uma autorização que não existe. Não há RBAC/ABAC nem defesa sistemática contra IDOR/BOLA. Alguns controllers retornam senha, erros internos ou registros completos. O frontend não é uma barreira de segurança: chamadas diretas à API recebem o mesmo tratamento que chamadas originadas pela interface.
