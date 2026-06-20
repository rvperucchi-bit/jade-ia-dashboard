---
name: Tab bar bottom padding
description: Como calcular padding correto para conteúdo não ficar atrás da tab bar absoluta
---

A tab bar usa `position: "absolute"` com height hardcoded: 60 (native) / 84 (web).

**Regra:** qualquer tela dentro de tabs precisa adicionar ao final do scroll/input:
```js
const TAB_BAR_H = Platform.OS === "web" ? 84 : 60;
const bottomPad = TAB_BAR_H + (Platform.OS === "web" ? 0 : insets.bottom);
```

**Por quê:** `insets.bottom` dá só o safe area (home indicator, ~34px). Não inclui a tab bar. Sem TAB_BAR_H, o input/conteúdo fica escondido atrás da barra.

**Screens que já aplicam correto:** index.tsx, mais.tsx, jade.tsx (corrigido).
**Como aplicar:** nas ScrollViews use `contentContainerStyle={{ paddingBottom: bottomPad }}`; nas input bars use `paddingBottom: bottomPad + 8`.
