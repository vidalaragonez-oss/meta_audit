# Descrição dos Módulos Principais
1. **`/src/app` (Presentation Layer):** Contém as páginas, layouts e o roteamento do Next.js. Responsável pela montagem da interface (UI) com componentes do shadcn.
2. **`/src/components` (UI/UX):** Componentes burros e reutilizáveis (Botões, Modais, Skeleton Loaders, Badges).
3. **`/src/lib/meta` (Meta Service):** Encapsula toda a lógica de comunicação com a Graph API, normalização de JSONs aninhados e paginação de recursos.
4. **`/src/lib/rule-engine` (Regras de Negócio):** Recebe os dados brutos da Meta e aplica as lógicas de semáforo (Sucesso, Atenção, Perigo) com base em métricas como CTR, Frequência e CPL.
5. **`/src/lib/ai` (AI Analyst Service):** Responsável por injetar os dados da auditoria em templates de prompts e gerenciar o fluxo de streaming com a API da Anthropic.
6. **`/src/lib/db` (Repository):** Gerencia a instância do Prisma Client e os repositórios para manipular `Settings` e `AuditHistory`.

# Request Lifecycle (Fluxo Geral de Dados)
**Exemplo: Fluxo de Auditoria**
1. Usuário seleciona a conta e clica em "Iniciar Auditoria" na interface.
2. Componente React invoca uma *Server Action* passando o ID da Conta.
3. A *Server Action* busca as credenciais no Banco Local (Prisma).
4. O `MetaService` faz as requisições em cascata (Campaigns → AdSets → Ads) e obtém os Insights (14 dias).
5. Os dados em estado bruto são passados para o `RuleEngineService`, que anexa as "Flags" (Alertas) aos nós específicos.
6. A árvore de dados enriquecida é retornada para o Frontend.
7. O Frontend armazena o resultado no *Zustand* e renderiza a interface em Cascata instantaneamente.

# Relações e Dependências
- O Frontend é totalmente "cego" sobre como buscar dados na Meta API. Ele apenas consome as *Server Actions*.
- O `RuleEngineService` é uma camada pura, podendo ser testada isoladamente apenas enviando objetos JSON simulados.