# Meta Ads Intelligence - Visão Geral do Sistema

Este documento detalha o funcionamento, a arquitetura e a configuração técnica do sistema de auditoria forense para Meta Ads.

## 1. Objetivo do Sistema
O **Meta Ads Intelligence** é uma ferramenta de auditoria profunda projetada para identificar "vazamentos" de orçamento em contas de anúncios. Ele analisa a hierarquia completa (**Campanhas -> Conjuntos de Anúncios -> Anúncios**) e aplica regras de decisão para gerar um plano de ação imediato.

## 2. Arquitetura Técnica
*   **Framework**: Next.js 16.2.4 (Canary) rodando com **Turbopack**.
*   **Frontend**: React 19 com componentes `@base-ui/react` e Tailwind CSS 4.
*   **Backend**: Server Actions do Next.js para processamento seguro.
*   **Banco de Dados**: SQLite local (`dev.db`).

## 3. Configuração de Banco de Dados (Solução Wasm)
Devido a instabilidades conhecidas entre o Prisma 7, o Turbopack e caracteres especiais em caminhos do Windows (como o `&`), implementamos uma solução de **Bypass via WebAssembly**:

*   **Motor**: `sql.js` (SQLite rodando em Wasm).
*   **Vantagem**: Não possui dependências nativas (`.node` ou `.exe`), o que elimina erros de DLL ("Engine Type Client" ou "Module Not Found").
*   **Persistência**: O sistema carrega o `dev.db` para a memória no boot e salva as alterações de volta no disco em cada operação de escrita.
*   **Interface**: O arquivo `src/lib/db/prisma.ts` emula a API do Prisma, permitindo que o resto do sistema funcione sem saber que o motor foi trocado.

## 4. Funcionalidades Principais

### A. Auditoria Profunda (Deep Audit)
O sistema não analisa apenas o resumo da conta, ele faz uma descida em cascata:
1.  Busca todas as **Campanhas** ativas.
2.  Para cada campanha, analisa os **Conjuntos de Anúncios** (Ad Sets).
3.  Para cada conjunto, audita os **Anúncios** individuais e seus insights.

### B. Motor de Regras (Rule Engine)
A análise é baseada em limites configuráveis pelo usuário:
*   **CPL Máximo**: Alerta se o Custo por Lead ultrapassar o limite.
*   **Frequência Máxima**: Identifica fadiga de público (ex: > 3.5).
*   **CTR Mínimo**: Identifica criativos com baixa performance (ex: < 0.5%).

### C. Plano de Ação AI
Utiliza os dados minerados para gerar um dossiê forense e um plano de ação priorizado (via Integração com Anthropic/OpenAI - a configurar).

## 5. Configuração do Ambiente (.env)
*   `DATABASE_URL`: Caminho para o banco SQLite.
*   `PRISMA_CLIENT_ENGINE_TYPE`: Definido como `binary` (embora o sistema use o Bypass Wasm como prioridade).
*   `META_ACCESS_TOKEN`: Token de acesso à API de Marketing do Meta.

## 6. Localização de Arquivos Chave
*   `src/lib/db/prisma.ts`: Driver do banco de dados (Wasm Bypass).
*   `src/lib/meta/meta-service.ts`: Integração com a API do Meta Ads.
*   `src/lib/rule-engine/rule-service.ts`: Lógica de auditoria e aplicação de limites.
*   `src/app/actions/audit.ts`: Orquestrador das Server Actions.

---
**Status Atual**: Sistema operacional e estabilizado no Windows.
