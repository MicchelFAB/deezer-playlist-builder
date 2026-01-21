# Solução de Captura de Token

Existem dois scripts disponíveis:

## 1. `add-tracks.sh` (Recomendado)
Tenta obter o token automaticamente a cada requisição. 

**Uso:**
```bash
./add-tracks.sh
```

**Como funciona:**
- Extrai os IDs do `playlist_tracks.txt`
- Obtém um novo token via `deezer.getUserData` antes de começar
- Processa as faixas em lotes de 50
- Se falhar, tenta obter um novo token e repetir

---

## 2. `add-tracks-manual.sh` (Alternativa)
Usa um token estático que você fornece manualmente.

**Uso:**
```bash
# Primeiro, abra seu navegador e copie um token válido
# Edite o arquivo e atualize a variável TOKEN
nano add-tracks-manual.sh

# Depois execute:
./add-tracks-manual.sh
```

**Como obter um token válido no navegador:**

1. Abra https://www.deezer.com no seu navegador
2. Faça login se não estiver
3. Abra o DevTools (F12)
4. Vá para "Network"
5. Faça qualquer ação que interaja com playlists
6. Procure por requests para `gw-light.php`
7. Na resposta, copie o valor de `checkForm`

---

## Problemas Comuns

**"VALID_TOKEN_REQUIRED"**
- O token expirou
- O token não é válido para playlist.addSongs
- Solução: Obtenha um novo token do navegador

**"Undefined or invalid output"**
- Parâmetros incorretos na requisição
- ARL expirado
- Solução: Verifique se o ARL ainda é válido

---

## Fluxo Manual Completo

Se ambos os scripts falharem, você pode adicionar as faixas manualmente:

```bash
# 1. Obtenha um token válido do navegador (veja acima)
TOKEN="seu_token_aqui"
ARL="seu_arl_aqui"
PLAYLIST_ID="14853190063"

# 2. Teste com alguns IDs primeiro
SONGS="3399995131,3399995141,3399995151"

curl -s 'https://www.deezer.com/ajax/gw-light.php?method=playlist.addSongs&api_version=1.0&input=3' \
  -X POST \
  -H "Cookie: arl=${ARL}; dzlang=en" \
  -H "Content-Type: text/plain;charset=UTF-8" \
  -H "Accept: application/json, text/plain, */*" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Origin: https://www.deezer.com" \
  -H "Referer: https://www.deezer.com/" \
  -H "User-Agent: Mozilla/5.0" \
  --data "{\"playlist_id\":${PLAYLIST_ID},\"songs\":[${SONGS}],\"offset\":0,\"api_token\":\"${TOKEN}\"}" | jq .
```

Se isso funcionar com alguns IDs, você sabe que o token é válido. Atualize o `add-tracks-manual.sh` com esse token.

---

## Segurança

⚠️ **Importante**: O ARL e o TOKEN são equivalentes a uma senha. 
- Não compartilhe-os
- Não faça commit deles em repositórios públicos
- Delete o `.env` após terminar

Para revogar o acesso, você pode:
1. Fazer logout em todos os dispositivos na conta Deezer
2. Ou deixar a sessão expirar naturalmente
