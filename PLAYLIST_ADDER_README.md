# 🎵 Deezer Playlist Batch Adder

Ferramenta para adicionar músicas em lote a playlists do Deezer usando a API privada.

## 📋 Contexto

Este projeto surgiu da necessidade de adicionar automaticamente músicas à uma playlist do Deezer, contornando a limitação da API pública que não permite mais registros de novos apps.

## 🎯 Fluxo Completo

### 1. Busca de Músicas (TypeScript)

```bash
# Buscar álbuns de artistas e gerar lista de track IDs
node search-albums.js --inputFile artist.txt --outputFile playlist_tracks.txt
```

**Entrada**: `artist.txt` - Lista de artistas (um por linha)  
**Saída**: `playlist_tracks.txt` - Track IDs e metadados

### 2. Adicionar à Playlist (Bash Script)

```bash
# Configurar credenciais e executar
export DEEZER_API_TOKEN="seu_token_aqui"
export DEEZER_USER_ID="seu_user_id"
export DEEZER_COOKIES="string_completa_dos_cookies"
export DEEZER_PLAYLIST_ID="sua_playlist_id"

./add-tracks-manual.sh
```

## 🔧 Configuração

### Passo 1: Obter Credenciais do Navegador

1. **Abra o Deezer no navegador**:
   - Acesse https://www.deezer.com
   - Faça login na sua conta

2. **Abra DevTools**:
   - Pressione `F12` (ou `Ctrl+Shift+I`)
   - Vá para a aba **Network**

3. **Adicione uma música manualmente**:
   - Navegue até sua playlist
   - Adicione UMA música qualquer à playlist

4. **Capture a requisição**:
   - No DevTools, encontre a requisição `gw-light.php?method=playlist.addSongs`
   - Clique com botão direito → **Copy** → **Copy as cURL**

5. **Extraia os valores**:
   ```bash
   # Exemplo do curl copiado:
   curl 'https://www.deezer.com/ajax/gw-light.php?method=playlist.addSongs&input=3&api_version=1.0&api_token=XXXX&cid=YYYY' \
     -H 'x-deezer-user: 1234567890' \
     -H 'Cookie: arl=...muito_longo...; sid=...; jwt=...'
   ```

   Extraia:
   - `api_token=XXXX` → `DEEZER_API_TOKEN`
   - `x-deezer-user: 1234567890` → `DEEZER_USER_ID`
   - Todo o conteúdo após `Cookie:` → `DEEZER_COOKIES`

### Passo 2: Configurar Variáveis de Ambiente

**Opção A - Arquivo .env local**:
```bash
# Crie arquivo .env.local (não versione!)
cat > .env.local << 'EOF'
export DEEZER_API_TOKEN="seu_token_aqui"
export DEEZER_USER_ID="seu_user_id"
export DEEZER_COOKIES="sid=...; arl=...; jwt=...; ..."
export DEEZER_PLAYLIST_ID="sua_playlist_id"
EOF

# Carregue as variáveis
source .env.local
```

**Opção B - Editar o script diretamente**:
```bash
# Edite add-tracks-manual.sh e substitua os valores padrão
nano add-tracks-manual.sh
```

## 🚀 Uso

### Buscar e Listar Músicas

```bash
# Instalar dependências (primeira vez)
npm install

# Compilar TypeScript
npm run build

# Buscar músicas de artistas
node search-albums.js --inputFile artist.txt --outputFile playlist_tracks.txt
```

**Formato do artist.txt**:
```
Limão Com Mel
Capim Com Mel
Mel Com Terra
```

**Saída em playlist_tracks.txt**:
```
## Track IDs
3399995131,3399995141,3399995151,...

## Complete Track List
Track: Temporal (Limão Com Mel) - Album: Sucessos
  ID: 3399995131
  ...
```

### Adicionar Músicas à Playlist

```bash
# 1. Configure as variáveis de ambiente (veja Passo 2 acima)
source .env.local

# 2. Execute o script
./add-tracks-manual.sh
```

**Saída esperada**:
```
🎵 Deezer Playlist Batch Adder
===========================================
Playlist ID: 14853190063
Token: h6B8diKHJGik4QqW9JjS...

📂 Extraindo IDs...
✓ Total: 1384 faixas

🎶 Adicionando em lotes de 50...
  ✓ Lote 1 adicionado
  ✓ Lote 2 adicionado
  ...
  ✓ Lote 28 adicionado

================================
✅ Processo finalizado!
📊 Total processado: 1384
🎵 Adicionadas: ~1384
```

## 📊 Especificações Técnicas

### API Endpoint
```
POST https://www.deezer.com/ajax/gw-light.php
Query Params:
  - method: playlist.addSongs
  - input: 3
  - api_version: 1.0
  - api_token: <TOKEN>
  - cid: <RANDOM_9_DIGITS>
```

### Request Format
```json
{
  "playlist_id": "14853190063",
  "songs": [
    ["3399995131", 0],
    ["3399995141", 0],
    ...
  ],
  "offset": -1,
  "ctxt": {
    "id": "14853190063",
    "t": "playlist_assistant",
    "dc": "suggested-from-recently-listen-tracks"
  }
}
```

### Headers Obrigatórios
```
User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0)
Content-Type: text/plain;charset=UTF-8
x-deezer-user: <USER_ID>
Cookie: <FULL_COOKIE_STRING>
Origin: https://www.deezer.com
Referer: https://www.deezer.com/us/playlist/<PLAYLIST_ID>
```

### Descobertas Importantes

1. **CID (Client ID)**: Muda a cada requisição, gerado aleatoriamente (9 dígitos)
2. **Token**: Permanece estável por várias horas
3. **Cookies Completos**: Necessários todos os cookies (arl, sid, jwt, _abck, bm_sz, etc)
4. **Songs Format**: Array de arrays `[["track_id", 0], ...]` não array simples
5. **Offset**: Usar `-1` para adicionar ao final
6. **Rate Limit**: Delay de 1s entre lotes (50 músicas/lote)

## 🔒 Segurança

**⚠️ IMPORTANTE**: As credenciais obtidas do navegador são sensíveis!

- **NÃO commite** arquivos com tokens/cookies reais
- Use `.env.local` (já está no `.gitignore`)
- Tokens expiram, mas cookies de sessão podem ser válidos por dias
- O `arl` cookie é equivalente à sua senha - proteja-o!

**Após uso**:
```bash
# Limpar variáveis de ambiente
unset DEEZER_API_TOKEN DEEZER_USER_ID DEEZER_COOKIES

# Opcional: Fazer logout do Deezer no navegador para invalidar cookies
```

## 📁 Estrutura de Arquivos

```
deezer-playlist-builder/
├── search-albums.ts/js     # Busca músicas na API pública
├── add-tracks-manual.sh    # Adiciona músicas via API privada
├── DeezerClient.ts         # Cliente original (API pública - deprecated)
├── artist.txt              # Input: lista de artistas
├── playlist_tracks.txt     # Output: track IDs encontrados
├── .env.local              # Suas credenciais (NÃO versionar!)
└── PLAYLIST_ADDER_README.md # Esta documentação
```

## 🐛 Troubleshooting

### Erro: "VALID_TOKEN_REQUIRED"
**Causa**: Token ou cookies expirados  
**Solução**: Obtenha novas credenciais do navegador (veja Passo 1)

### Erro: "jq: command not found"
**Causa**: jq não instalado  
**Solução**: 
```bash
# Ubuntu/Debian
sudo apt install jq

# macOS
brew install jq
```

### Script não encontra músicas
**Causa**: Formato incorreto do artist.txt  
**Solução**: Um artista por linha, sem linhas vazias extras

### Músicas não aparecem na playlist
**Causa**: Playlist ID incorreto ou permissões  
**Solução**: Verifique se você é dono da playlist e o ID está correto

## 🎓 Como Funciona

### 1. TypeScript Search (API Pública)
```typescript
// Busca pública - não requer autenticação
const url = `http://api.deezer.com/search/artist?q=${artistName}`;
// Depois busca álbuns do artista
const albumsUrl = `http://api.deezer.com/artist/${artistId}/albums`;
// Extrai todos os track IDs
```

### 2. Bash Upload (API Privada)
```bash
# Gera CID aleatório para cada lote
CID=$(printf "%09d" $((RANDOM * RANDOM)))

# Formata IDs: "123,456,789" → [["123",0],["456",0],["789",0]]
FORMATTED=$(echo "$IDS" | sed 's/\([0-9]\+\)/["\1",0]/g')

# Faz POST com todos os cookies de sessão
curl "...&api_token=${TOKEN}&cid=${CID}" \
  -H "Cookie: ${FULL_COOKIE_STRING}" \
  --data-raw '{"playlist_id":"...","songs":[...]}'
```

## 📝 Licença

Este projeto é fornecido como está, sem garantias. Use por sua conta e risco.
A API privada do Deezer não é documentada oficialmente e pode mudar a qualquer momento.

## 🙏 Créditos

Desenvolvido para automatizar o processo de construção de playlists do Deezer
quando a API oficial não permite novos registros de aplicações.

---

**Última atualização**: Janeiro 2026  
**Versão**: 1.0.0
