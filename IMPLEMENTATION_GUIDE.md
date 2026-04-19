# Documentação: Feedback de Avaliações + Notificações em Tempo Real

## 📋 Visão Geral

Implementação completa de duas funcionalidades para o aplicativo **Couple's Swipe**:

1. **Feedback de Avaliações** - Exibição de likes/dislikes nas fotos da galeria
2. **Notificações em Tempo Real** - Alertas quando fotos são adicionadas ou avaliadas

---

## 🎯 Funcionalidade 1: Feedback de Avaliações

### O que foi implementado

Cada foto na galeria do usuário agora exibe:
- **Badges visuais** no canto superior esquerdo
- ❤️ **Contador de Likes** - com ícone de coração
- 👎 **Contador de Dislikes** - com ícone de dislike

### Arquivos principais

```
src/
├── services/ratingStatsService.ts      # Funções de cálculo de estatísticas
├── components/PhotoFeedbackBadge.tsx   # Componente de badge visual
└── components/Upload.tsx               # Integração dos badges
```

### Como funciona

1. **Cálculo de Estatísticas**: `getRatingStats()` conta likes/dislikes por foto
2. **Renderização**: `PhotoFeedbackBadge` exibe os números em badges animadas
3. **Reatividade**: Atualiza automaticamente quando novas avaliações chegam (via Realtime)

### Design Visual

- Gradientes com cores distintas para likes (verde) e dislikes (vermelho)
- Backdrop blur para legibilidade sobre fotos
- Animações suaves ao aparecer
- Aparece apenas se houver avaliações

### Exemplo

```
┌──────────────────┐
│❤️ 3  👎 1         │ ← Badges de feedback
│                  │
│    Foto          │
│                  │
└──────────────────┘
```

---

## 🔔 Funcionalidade 2: Notificações em Tempo Real

### O que foi implementado

Notificações aparecem no canto superior direito quando:
- 📸 **Nova foto adicionada** - parceiro enviou uma foto
- ❤️ **Foto recebeu like** - uma de suas fotos foi curtida
- 👎 **Foto recebeu dislike** - uma de suas fotos foi rejeitada

### Arquivos principais

```
src/
├── services/notificationService.ts     # Serviço centralizado
├── hooks/useNotifications.ts           # Hook para gerenciar estado
└── components/NotificationCenter.tsx   # Componente de exibição
```

### Como funciona

#### 1. **Subscription ao Realtime**
```
notificationService.subscribe()
    ↓
Escuta mudanças em:
  - Table: photos (INSERT)
  - Table: ratings (INSERT)
```

#### 2. **Emissão de Notificações**
Quando há mudanças, o serviço emite eventos para listeners.

#### 3. **Exibição**
- Notificações aparecem na UI via `NotificationCenter`
- Auto-dismiss após 4 segundos
- Máximo 5 simultâneas

### Uso no Componente

```jsx
const { notifications, removeNotification } = useNotifications(currentUser);

<NotificationCenter 
  notifications={notifications} 
  onRemove={removeNotification} 
/>
```

### Design Visual

```
┌─────────────────────────┐
│ 📸 Nova foto adicionada │  ← Notificação com emoji
│ Maria adicionou uma...  │     Auto-dismiss em 4s
│                  [X]    │
└─────────────────────────┘
```

---

## 🔧 Integração Técnica

### Alterações Realizadas

#### 1. **src/components/Upload.tsx**
- Importa `PhotoFeedbackBadge` e `getRatingStats`
- Aceita `ratings` como prop
- Exibe badges nas fotos salvas

```tsx
<PhotoFeedbackBadge likes={stats.likes} dislikes={stats.dislikes} />
```

#### 2. **src/pages/Index.tsx**
- Importa `useNotifications` e `NotificationCenter`
- Passa `ratings` para `Upload`
- Renderiza `NotificationCenter` no topo

```tsx
const { notifications, removeNotification } = useNotifications(currentUser);

<NotificationCenter notifications={notifications} onRemove={removeNotification} />
```

### Dados Utilizados

A implementação usa dados existentes:
- **photos table** - fotos enviadas
- **ratings table** - likes/dislikes

Nenhuma alteração no banco foi necessária!

---

## 📊 Fluxo de Dados

```
User A envia foto
    ↓
INSERT photos table
    ↓
Supabase Realtime event
    ↓
notificationService emite
    ↓
useNotifications recebe
    ↓
NotificationCenter mostra para User B
```

---

## ⚙️ Configuração

### Requisitos
- ✅ Supabase com Realtime habilitado (já está configurado)
- ✅ Tables `photos` e `ratings` com REPLICA IDENTITY FULL (já está)
- ✅ Publicação Realtime ativa (já está)

### Sem Configuração Necessária
A implementação usa o Supabase já configurado no projeto!

---

## 🚀 Testando

### Teste Local com 2 Abas

1. **Abra dois navegadores** ou duas abas (usuário A e B)
2. **Em uma aba (User A)**:
   - Vá para "Suas fotos"
   - Verifique que as fotos mostram badges de feedback
3. **Na outra aba (User B)**:
   - Vá para "Avaliar"
   - Curta ou rejeite fotos de User A
4. **Volte para User A**:
   - Veja as badges atualizarem em tempo real
   - Receba notificação de que foi avaliado

### Esperado

✅ Badges aparecem/atualizam sem reload
✅ Notificações mostram no canto superior direito
✅ Notificações suem após 4 segundos
✅ Sem erros no console

---

## 🛡️ Tratamento de Erros

| Erro | Tratamento |
|------|-----------|
| Falha de conexão Realtime | Service para gracefully |
| Photo_id inválido | Badge mostra 0 likes/dislikes |
| Usuário desconecta | Subscriptions se limpam automaticamente |
| Rated own photo (RLS) | Bloqueado pelo Supabase RLS |

---

## 🎨 Customização

### Alterar tempo de auto-dismiss
`src/hooks/useNotifications.ts` → `NOTIFICATION_DURATION`

```tsx
const NOTIFICATION_DURATION = 4000; // em ms
```

### Alterar cores dos badges
`src/components/PhotoFeedbackBadge.tsx` → usar classe Tailwind

```tsx
// Mude as cores aqui
className="bg-gradient-to-r from-like/20 to-like/10"
```

### Alterar máximo de notificações
`src/hooks/useNotifications.ts` → `MAX_NOTIFICATIONS`

```tsx
const MAX_NOTIFICATIONS = 5;
```

---

## 📁 Arquitetura Final

```
src/
├── services/
│   ├── photoService.ts          (existente)
│   ├── matchService.ts          (existente)
│   ├── uploadService.ts         (existente)
│   ├── ratingStatsService.ts    ✨ NOVO
│   └── notificationService.ts   ✨ NOVO
├── hooks/
│   ├── useCoupleBackend.ts      (existente)
│   ├── use-mobile.tsx           (existente)
│   ├── use-toast.ts             (existente)
│   └── useNotifications.ts      ✨ NOVO
├── components/
│   ├── Upload.tsx               (MODIFICADO)
│   ├── PhotoFeedbackBadge.tsx   ✨ NOVO
│   └── NotificationCenter.tsx   ✨ NOVO
└── pages/
    └── Index.tsx                (MODIFICADO)
```

---

## ✅ Checklist de Implementação

- [x] Serviço de estatísticas de ratings
- [x] Badge component para feedback
- [x] Integração na galeria de fotos
- [x] Serviço de notificações centralizado
- [x] Hook useNotifications
- [x] Componente NotificationCenter
- [x] Integração com Supabase Realtime
- [x] Auto-dismiss de notificações
- [x] Tratamento de erros
- [x] Tipo-segurança TypeScript
- [x] Sem conflitos com código existente
- [x] Testes locais validados

---

## 📝 Notas

- Todas as notificações são locais (não persistem)
- Badges mostram dados persistentes (do banco)
- Realtime é bidirecional (ambos os usuários recebem)
- Compatível com dark mode (usa cores do tema)
- Performance otimizada (sem polling)

---

## 🐛 Troubleshooting

### Badges não aparecem
1. Verifique se as avaliações estão sendo salvas
2. Confirme que `ratings` está sendo passada para `Upload`
3. Abra DevTools e verifique `getRatingStats` nos dados

### Notificações não aparecem
1. Verifique conexão com Supabase
2. Confirme que Realtime está habilitado no Supabase
3. Veja console para erros de subscription

### Notificações aparecem para o próprio usuário
- Isso é esperado se você testar em duas abas do mesmo usuário
- Teste com 2 usuários diferentes (A e B)

---

## 📚 Referências

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hooks](https://react.dev/reference/react/hooks)
- [TypeScript](https://www.typescriptlang.org/docs/)
