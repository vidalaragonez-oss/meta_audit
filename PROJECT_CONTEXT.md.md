# Visão Geral do Sistema
O "TS · Meta Ads Intelligence" é uma aplicação web de uso interno e execução local voltada para a auditoria de alto desempenho de contas de anúncios do Meta Ads. O objetivo do produto é analisar cascatas de dados (Campanha → Ad Set → Ad), aplicar regras de negócios predefinidas para identificar gargalos (ex: CPL alto, Frequência saturada) e gerar planos de ação acionáveis utilizando a IA da Anthropic (Claude).

# Stack Tecnológica Principal
- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript (Strict Mode)
- **Estilização & UI:** Tailwind CSS + shadcn/ui
- **Gestão de Estado Global:** Zustand
- **Banco de Dados Local:** SQLite via Prisma ORM

# Integrações Externas
1. **Meta Graph API (v19.0+):** Leitura de `adaccounts`, `campaigns`, `adsets`, `ads` e `insights` (focado em um período de 14 dias).
2. **Anthropic API:** Comunicação com o modelo Claude (ex: `claude-3-5-sonnet`) para geração de diagnósticos e planos de ação automatizados.

# Contexto Operacional
O sistema operará estritamente de forma local (`localhost`). Não há necessidade de autenticação multi-inquilino (SaaS), controles complexos de RBAC (Role-Based Access Control) ou infraestrutura em nuvem. A prioridade é a velocidade de execução, segurança das chaves de API (mantidas no servidor local) e fluxo de trabalho do gestor de tráfego.

# Princípios Gerais de Arquitetura
- **Local-First:** Os dados e configurações cruciais (como chaves de API e prompts) ficam salvos no SQLite local.
- **Segurança Backend:** Nenhuma chave de API deve ser exposta ao cliente. Todas as chamadas para a Meta ou Anthropic devem ser envelopadas por Server Actions ou Route Handlers do Next.js.
- **Streaming de Dados:** Respostas longas (como o plano de ação do Claude) devem priorizar o uso de Server-Sent Events (SSE) ou React Suspense para melhorar a experiência do usuário.