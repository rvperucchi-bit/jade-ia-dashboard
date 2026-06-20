---
name: Auth routing pattern
description: Como o roteamento de auth está estruturado neste projeto
---

Não usar grupos `(auth)/` — o projeto usa Stack no root com telas de auth diretamente em `app/`:
- `app/login.tsx`
- `app/cadastro.tsx`
- `app/splash.tsx`

Registrar todas no `_layout.tsx` dentro de `RootLayoutNav()` como `<Stack.Screen name="login" .../>`.

**Por quê:** evita conflito de navegação entre grupos. AuthContext usa AsyncStorage para persistir sessão.
**Credenciais mock:** rodrigo@jadeia.com.br / jade2026
