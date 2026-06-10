## Problema

Na home, cada bloco chama `servico/osq0001?status={cod}` por código (1–2, 3–5, 6). Se a API UNO devolver alguma OS com `codStatus` fora da faixa pedida (por algum motivo de servidor/cache/regra), ela aparece no card mesmo assim — não há guard client-side.

## Plano (flag de dev, removível no go-live)

1. **Novo `src/lib/uno/dev-flags.ts`**
   ```ts
   export const DEV_RESTRICT_OS_STATUS_1_6 = true;
   export const DEV_OS_STATUS_ALLOWED = [1, 2, 3, 4, 5, 6] as const;
   ```

2. **`src/lib/uno/os.ts` — `listarOSsPorStatus`**
   Após o `flatMap`, filtrar:
   ```ts
   const all = pages.flatMap((p) => p.content ?? []);
   const filtered = DEV_RESTRICT_OS_STATUS_1_6
     ? all.filter(
         (o) =>
           typeof o.codStatus === "number" &&
           DEV_OS_STATUS_ALLOWED.includes(o.codStatus as 1|2|3|4|5|6) &&
           codigos.includes(o.codStatus), // garante que pertence ao bloco
       )
     : all;
   return filtered.slice(0, limit);
   ```

3. **`src/routes/os.$codOs.tsx` — `SituacoesSection`**
   Trocar o filtro fixo `codigo >= 1 && codigo <= 6` por leitura do mesmo flag:
   ```ts
   const etapas = situacoes
     .filter((s) => !DEV_RESTRICT_OS_STATUS_1_6 || DEV_OS_STATUS_ALLOWED.includes(s.codigo))
     .sort((a, b) => a.codigo - b.codigo);
   ```

## Go-live

Basta setar `DEV_RESTRICT_OS_STATUS_1_6 = false` (ou apagar o arquivo e os 2 imports) — nenhum outro lugar do app precisa ser tocado.

## Fora do escopo

- Não muda UI, tipos, endpoints, nem o mapeamento `OS_COD_STATUS`.
- Não toca em outros lugares que consomem OS (telas de etapa/caminhão).
