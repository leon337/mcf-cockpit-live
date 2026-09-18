# Canonical Visual Reference — MCF Cockpit LIVE

Mission: MCF-COCKPIT-VISUAL-RECONCILIATION-001 (#229)

The four approved prototypes in `reference/originals/` are the canonical visual specification.

## Non-negotiable rule

Do not reinterpret these concepts as a generic dashboard system.

Each concept has its own composition, proportions, density, hierarchy and interaction model. The LIVE implementation must preserve those traits while replacing illustrative/mock data with real data.

## Concept 1 — MCF Cockpit — Visão Geral

Source: `reference/originals/01_mcf_cockpit_dark.html`

Visual identity:
- dark Linux desktop cockpit;
- left navigation rail;
- greeting + GitHub/Linux session header;
- 4 KPI cards;
- repository grid;
- large active-mission card;
- AUGUSTO Voice Reporter control card;
- full-height GitHub activity rail;
- bottom MCF banner.

Original interactive hotspots: 13

Key labels:
- Visão Geral
- Missões
- Repositórios
- GitHub
- VoiceHub
- Agentes
- Configurações
- Abrir ao iniciar
- Repositórios MCF
- Missão ativa
- Ativar reporte
- Pausar
- Atividade GitHub

## Concept 2 — GitHub + MCF Mission Cockpit

Source: `reference/originals/02_github_mcf_mission_cockpit.html`

Visual identity:
- cinematic dark-blue mission dashboard;
- MCF logo/top strap;
- repository list on the left;
- mission hero in the center;
- GitHub event feed on the right;
- project health donut, CI/CD bars and contribution chart;
- bottom AUGUSTO command bar + quick actions + automations.

Original interactive hotspots: 13

Key labels:
- Repositórios MCF
- Linux iniciado
- GitHub conectado
- VoiceHub online
- Autoabrir
- Missão ativa
- Feed GitHub
- AUGUSTO
- Comando rápido
- Monitoramento
- Relatórios diários
- Notificações
- Modo foco

## Concept 3 — MCF Startup Workspace

Source: `reference/originals/03_mcf_startup_workspace.html`

Visual identity:
- light Linux workspace;
- MCF navigation rail;
- repository navigator column;
- mission workspace center;
- checklist + timeline;
- GitHub notifications and agent activity on the right;
- VoiceHub card;
- bottom action row for mission continuation, silent mode, auto-open and mission-aware AUGUSTO.

Original interactive hotspots: 19

Key labels:
- MCF
- Missões
- Repositórios
- Agentes
- VoiceHub
- Notificações
- Configurações
- Missão atual
- Checklist
- Timeline
- Notificações GitHub
- Atividade agentes
- Continuar missão
- Abrir repositório
- Modo silencioso
- Autoabrir
- AUGUSTO com missão ativa

## Concept 4 — MCF Mission Control Futurista

Source: `reference/originals/04_mcf_mission_control_futurista.html`

Visual identity:
- dark cinematic Mission Control;
- left navigation;
- global search/top status;
- Earth/space hero;
- start monitoring + mission-aware reporting controls;
- colored mission/repository/PR/issue cards;
- VoiceHub, AUGUSTO, Linux and daily-summary cards;
- ecosystem topology map across the bottom.

Original interactive hotspots: 21

Key labels:
- Início
- Repositórios
- Pull Requests
- Issues
- Projetos
- VoiceHub
- AUGUSTO
- Ambiente Linux
- Relatórios
- Configurações
- Iniciar acompanhamento
- Reportar só com missão ativa
- Missão em andamento
- Repositórios críticos
- PRs aguardando gate
- Issues prioritárias
- VoiceHub
- AUGUSTO Reporter
- Ambiente Linux
- Resumo do dia
- Mapa ecossistema

## LIVE-data rule

Real GitHub/MCF data must replace illustrative values without changing the original visual hierarchy.

Local integrations that the Vercel runtime cannot observe directly must be labeled LOCAL-ONLY or sourced through an authenticated local bridge. Never display invented ONLINE state as real.

## QA rule

Visual QA must compare each deployed concept against its matching original reference at the same 1672×941 baseline, in addition to functional tab/interaction QA.
