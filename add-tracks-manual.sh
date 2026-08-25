#!/bin/bash

# ==============================================
# Deezer Playlist Batch Adder
# ==============================================
# Script para adicionar músicas em lote a uma playlist do Deezer
# usando a API privada gw-light.php
#
# IMPORTANTE: Configure as variáveis abaixo antes de executar

# === CONFIGURAÇÃO OBRIGATÓRIA ===
# Obtenha estes valores do navegador (DevTools -> Network -> Copy as cURL):
# 1. Abra https://www.deezer.com no navegador
# 2. Adicione UMA música à playlist manualmente
# 3. No DevTools (F12) -> aba Network -> encontre requisição "gw-light.php?method=playlist.addSongs"
# 4. Clique com botão direito -> Copy -> Copy as cURL
# 5. Extraia os valores abaixo do comando copiado

# Token de CSRF - muda raramente (encontre em api_token=...)
TOKEN="${DEEZER_API_TOKEN:-}"

# User ID - seu ID do Deezer (encontre em x-deezer-user: ...)
USER_ID="${DEEZER_USER_ID:-}"

# String completa dos Cookies (tudo após -H 'Cookie: ...')
# IMPORTANTE: Inclui arl, sid, jwt e outros cookies de sessão
COOKIE_STRING="${DEEZER_COOKIES:-}"

# === CONFIGURAÇÃO DA PLAYLIST ===
PLAYLIST_ID="${DEEZER_PLAYLIST_ID:-14853190063}"
INPUT_FILE='playlist_tracks.txt'
BATCH_SIZE=50

echo "🎵 Deezer Playlist Batch Adder (Modo Manual)"
echo "==========================================="
echo "Playlist ID: $PLAYLIST_ID"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Extrair IDs
echo "📂 Extraindo IDs..."
TRACK_IDS=$(sed -n '/## Track IDs/,/^## Complete Track List/p' "$INPUT_FILE" | grep -oE '[0-9]{7,}' | tr '\n' ',')
TRACK_IDS="${TRACK_IDS%,}"

IFS=',' read -ra TRACKS <<< "$TRACK_IDS"
TOTAL_TRACKS=${#TRACKS[@]}
echo "✓ Total: $TOTAL_TRACKS faixas"
echo ""

# Processar em lotes
echo "🎶 Adicionando em lotes de $BATCH_SIZE..."
ADDED=0
FAILED=0
BATCH_NUM=0
BATCH_SONGS=""

for i in "${!TRACKS[@]}"; do
    BATCH_SONGS="${BATCH_SONGS}${TRACKS[$i]},"
    
    if (( (i + 1) % BATCH_SIZE == 0 )) || (( i == TOTAL_TRACKS - 1 )); then
        BATCH_SONGS="${BATCH_SONGS%,}"
        BATCH_NUM=$((BATCH_NUM + 1))
        
        # Gerar CID aleatório para cada requisição (9 dígitos como no navegador)
        CID=$(printf "%09d" $((RANDOM * RANDOM)))
        
        # Converter IDs para formato [["id",0], ["id",0], ...]
        FORMATTED_SONGS=$(echo "$BATCH_SONGS" | sed 's/\([0-9]\+\)/["\1",0]/g')
        
        response=$(curl -s "https://www.deezer.com/ajax/gw-light.php?method=playlist.addSongs&input=3&api_version=1.0&api_token=${TOKEN}&cid=${CID}" \
          -X POST \
          -H "User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0" \
          -H "Accept: */*" \
          -H "Accept-Language: en-US,en;q=0.9" \
          -H "Content-Type: text/plain;charset=UTF-8" \
          -H "Referer: https://www.deezer.com/us/playlist/${PLAYLIST_ID}" \
          -H "x-deezer-user: ${USER_ID}" \
          -H "Origin: https://www.deezer.com" \
          -H "Cookie: ${COOKIE_STRING}" \
          --data-raw "{\"playlist_id\":\"${PLAYLIST_ID}\",\"songs\":[${FORMATTED_SONGS}],\"offset\":-1,\"ctxt\":{\"id\":\"${PLAYLIST_ID}\",\"t\":\"playlist_assistant\",\"dc\":\"suggested-from-recently-listen-tracks\"}}")
        
        if echo "$response" | jq -e '.error | length == 0' &>/dev/null; then
            echo "  ✓ Lote $BATCH_NUM adicionado"
            ADDED=$((ADDED + (BATCH_NUM * BATCH_SIZE < TOTAL_TRACKS ? BATCH_SIZE : TOTAL_TRACKS - (BATCH_NUM - 1) * BATCH_SIZE)))
        else
            error=$(echo "$response" | jq -r '.error | keys[0]')
            echo "  ⚠ Erro no lote $BATCH_NUM: $error"
            FAILED=$((FAILED + BATCH_SIZE))
        fi
        
        BATCH_SONGS=""
        sleep 1
    fi
done

echo ""
echo "================================"
echo "✅ Processo finalizado!"
echo "📊 Total processado: $TOTAL_TRACKS"
echo "🎵 Adicionadas: ~$ADDED"
echo "Playlist: https://www.deezer.com/playlist/$PLAYLIST_ID"
