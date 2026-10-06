---
name: project-direcao-visual
description: Direção visual do Amplifica (paleta esmeralda, Archivo expandida, painel verde-escuro) e padrão das telas de auth alinhadas ao design final do claude.ai
metadata:
  type: project
---

Direção em `src/app/globals.css` (não reinventar): paleta esmeralda com `light-dark()`, `--primary` verde, títulos em Archivo expandida (`font-heading`, h1-h3 automático), corpo Public Sans, wordmark "amplifica" em Bricolage Grotesque 800 (`font-wordmark`, só no `Logo`). Tokens `--player-*` = painel escuro fixo do player. Tokens de auth/alerta: `--field` (fundo de campo), `--destructive-strong` (texto de erro), `--destructive-soft*`/`--info-soft*`/`--success-soft-border` (Alert), `--primary-hover`, `--showcase-from/to` + utilities `bg-showcase`/`bg-showcase-grid`, `shadow-float`. Valores escuros de alert/primary-hover são derivados (só dk-Main do design foi baixado).

**Why:** o usuário aprovou o design final feito no claude.ai ("Amplifica — Telas de autenticação", claro + escuro, 1440px e 390px); o código foi alinhado a ele em vez de refeito.

**How to apply:**
- Layout de auth (`src/app/(auth)/layout.tsx`): `AuthHeader` (72px: Logo + nav Presets/IRs/Captures/Bundles + Entrar/Criar conta; abaixo de lg vira `MobileNavMenu`), cartão do form (radius 1.75rem, `bg-card`, rodapé com Termos/Privacidade) e `AuthShowcase` só em xl+ (cards ilustrativos com formas no lugar de nome/preço, h2 "Ouça antes de comprar. Toque como no palco."). Mobile: tela cheia `bg-card`, conteúdo alinhado ao topo, header 56px.
- Páginas filhas: `<div className="flex flex-col gap-6">` com `AuthHeading` + form + `SocialSignIn` (só se `googleOAuthEnabled`) + `AuthSwitchPrompt`/`AuthBackLink`.
- Campos de auth: 52px (`h-13`), `IconInput`, `Button size="xl"`, erro = borda 2px (border + ring-1 inset), `FieldError` já traz ícone; helper em `FieldDescription`; sempre `aria-describedby` apontando pro id do erro.
- Alert tem variantes `destructive | info | success`; resumo de erros usa `role="status"` pra não duplicar o `role="alert"` dos campos.
- Fluxos que a UI conhece: login vindo de senha redefinida usa `/login?senha=redefinida`; verificação vinda do login usa `?origem=login`.
- `InputGroup` (ui/input-group.tsx) é versão enxuta escrita à mão: não rodar `shadcn add input-group` (a CLI sobrescreve button/input).
- Botões sociais: só Google (único provedor no backend), logo colorido (exceção à regra de tokens, exigência de marca do Google), com texto visível "Continuar com Google".
- Alvo de toque 44px; links de texto usam `min-h-11 inline-flex`.
- Copy de auth agora usa "para" (como no design), não mais "pra".
- Auth cobre 100svh: layout `h-svh`, só o `<main>` do cartão rola. Espaçamentos via variáveis `--auth-*` e `--showcase-*` em `globals.css` que encolhem por ALTURA (<=880px e <=740px); variante `short:` (altura <=880) esconde o subtítulo do cadastro. Use `h-(--auth-control-h)` em campos/botões de auth e `gap-(--auth-gap)`/`gap-(--auth-section-gap)`.
- i18n: textos em `src/messages/{pt-BR,en}/ui.json` (namespaces meta, nav, theme, language, footer, showcase, auth.*, account); `errors.json` é do agente principal. Schemas Zod devolvem CHAVES de `errors`; forms traduzem com `useIssueTranslator`/`collectFieldErrors` (components/auth/fieldErrors.ts). Estado visual de erro de código vem de `result.code`, nunca do texto (`otpError.ts`).
- Persist do authFlowStore: só redirecionar por 'falta de e-mail' depois de `useAuthFlowHydrated()` (zustand devolve estado inicial na 1ª render de hidratação).
- Header: `HeaderPreferences` (ThemeToggle + LanguageSwitcher, dropdown radio com closeOnClick) em AuthHeader e no header de (public).
- Redefinição de senha é por código de 6 dígitos (sem link/token): /password/esqueci -> /password/redefinir.
- Sem número de política no texto (reembolso, tentativas): o design citava "7 dias" e "5 tentativas", mas não há `regras-de-negocio.md`; ficou fora até o usuário confirmar.
