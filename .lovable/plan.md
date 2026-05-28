Criar `.env` na raiz com:

```
VITE_UNO_API_BASE_URL=https://prata14.unoerp.com.br/granlave-api/
```

Verificar `.gitignore` e adicionar `.env` / `.env.local` caso ainda não estejam listados (não devem ir pro git).

Depois é necessário reiniciar o dev server para o Vite reler o `.env`.

Nenhuma outra mudança de código — a lógica de `resolveUnoApiBaseUrl` já consome `VITE_UNO_API_BASE_URL` com prioridade.