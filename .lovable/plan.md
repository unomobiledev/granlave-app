# Corrigir `crypto.randomUUID is not a function`

## Contexto

Com a tela branca resolvida (redirect 302), o app carrega dentro do iframe do UNO. Surgem dois novos erros no console:

1. `TypeError: crypto.randomUUID is not a function` — em `seedMock` (chamado pelo `AppHeader`).
2. `Access to fetch ... blocked by CORS policy: ... more-private address space 'local'` — bloqueio de Private Network Access (PNA) do Chrome ao chamar `http://192.168.1.19:8080` a partir de `https://granlave-app.lovable.app`.

**O erro #2 não vai ser tratado neste plano.** Confirmamos que é uma restrição do navegador que só ocorre porque o UNO de dev está em IP privado + HTTP. Em produção, com o UNO em um domínio público HTTPS (ex.: `https://erp.granlave.com.br`) e com os headers CORS corretos no UNO, o problema desaparece sozinho. Não há código nosso para mudar.

Este plano resolve apenas o erro #1.

## Causa raiz do #1

`crypto.randomUUID()` (Web Crypto API) só está disponível em **secure contexts** segundo a spec. Quando nosso app HTTPS é embedado em um iframe cujo top-level é `http://192.168.1.19:8080` (HTTP + IP privado), o `window.isSecureContext` do iframe vira `false` e a função `crypto.randomUUID` não é exposta.

O código que chama está no `seedMock` (usado pelo `AppHeader`) — provavelmente em `src/store/trucks.ts` ou similar, para gerar IDs de caminhões/etapas mockados.

## Solução

Criar um helper `safeRandomUUID()` em `src/lib/utils.ts` (ou novo arquivo `src/lib/uuid.ts`) que:

1. Usa `crypto.randomUUID()` quando disponível.
2. Faz fallback para uma implementação baseada em `crypto.getRandomValues()` (que existe mesmo em contextos inseguros na maioria dos navegadores modernos) gerando um UUID v4.
3. Último fallback: `Math.random()` (não-criptográfico, mas suficiente para IDs de mock).

```ts
// src/lib/uuid.ts
export function safeRandomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: UUID v4 com getRandomValues
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  }
  // Último fallback: Math.random (não criptográfico)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
```

## Mudanças

1. **Criar** `src/lib/uuid.ts` com o `safeRandomUUID()` acima.
2. **Localizar** todos os usos de `crypto.randomUUID()` no projeto (`rg -n "crypto\.randomUUID"` em `src/`) — pelo trace o principal está em `src/store/trucks.ts` (função `seedMock` e provavelmente outras).
3. **Substituir** cada `crypto.randomUUID()` por `safeRandomUUID()` com o import correspondente.

## Validação

1. Após publicar, abrir o iframe dentro do UNO → não deve mais aparecer `TypeError: crypto.randomUUID is not a function`.
2. Os caminhões mockados devem aparecer normalmente (o `seedMock` rodando até o fim significa que IDs foram gerados).
3. O erro de PNA continuará aparecendo até o UNO migrar para domínio público HTTPS — **isso é esperado** e não é nosso para corrigir.
