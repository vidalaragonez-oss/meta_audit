# Princípios de Clean Code e Nomenclatura
- Escreva código limpo, modular e de fácil leitura.
- Use nomes em inglês para variáveis, funções e arquivos base.
- Siga a convenção: `PascalCase` para Componentes React e Models do Prisma; `camelCase` para variáveis, funções genéricas e instâncias.
- Nomes devem revelar intenção (ex: use `fetchActiveCampaigns` em vez de `getData`).

# Regras de Comentários
- **NÃO** comente o óbvio (ex: `// busca usuários` acima de um `getUsers()`).
- **Obrigatório:** Comente o *POR QUÊ* de lógicas de negócio complexas. Exemplo: Se definir uma regra onde CPL > $80 é crítico, comente o motivo dessa métrica e em qual nicho ela se baseia.

# Tratamento de Erros Obrigatório
- Nenhuma falha deve ser silenciosa.
- No Backend (Server Actions/API): Use blocos `try/catch` padronizados, faça o log do erro de forma descritiva no console do Node e retorne um objeto estruturado: `{ success: false, error: 'Mensagem legível para o usuário' }`.
- No Frontend: Exiba *Toasts* (via shadcn/ui) com mensagens claras quando uma operação falhar.

# TypeScript Strict Mandatório
- O uso de TypeScript é não-negociável.
- **Proibido:** Uso de `any` ou `@ts-ignore` em lógicas de negócio.
- É obrigatório criar `Interfaces` ou `Types` rigorosos para os retornos da Meta Graph API, garantindo que o autocomplete funcione para métricas como `spend`, `cpm`, `ctr`, etc.

# Organização Modular e Padrões de Projeto
O projeto deve seguir a separação de responsabilidades (Controller → Service → Repository) adaptada ao Next.js:
1. **Controller (Server Actions / Route Handlers):** Recebe o input do frontend, valida e repassa para o Service.
2. **Service (Módulos de Domínio):** Contém a regra de negócio pura (ex: `RuleEngineService`, `MetaIntegrationService`). Não acessa o banco de dados diretamente.
3. **Repository (Prisma Clients):** Única camada autorizada a ler ou gravar dados no SQLite.