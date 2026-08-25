#!/bin/bash

# Configuração
ARL='7fc2b0a83963e8361387ba363cf189bdc129ff74226fe306937ce0fa782a688069ec677fe5ed9d2937c003ab7499627d7c32984c320c81fd8222bc96ef661408363aa4ba81e81ba1139f831d8f7de7e1abcbdbc96f62cb538fc4f95de8dbde85'
PLAYLIST_ID='14853190063'
INPUT_FILE='playlist_tracks.txt'
BATCH_SIZE=50  # Adiciona 50 faixas por requisição

echo "🎵 Deezer Playlist Batch Adder"
echo "================================"
echo "Playlist ID: $PLAYLIST_ID"
echo "Batch size: $BATCH_SIZE tracks"
echo ""

# Extrair IDs do arquivo (seção "Track IDs")
echo "📂 Extraindo IDs do arquivo..."
TRACK_IDS=$(sed -n '/## Track IDs/,/^## Complete Track List/p' "$INPUT_FILE" | grep -oE '[0-9]{7,}' | tr '\n' ',')
TRACK_IDS="${TRACK_IDS%,}"  # Remove última vírgula

# Converter para array
IFS=',' read -ra TRACKS <<< "$TRACK_IDS"
TOTAL_TRACKS=${#TRACKS[@]}

echo "✓ Total de faixas: $TOTAL_TRACKS"
echo ""

# Função para obter token com retry
get_token() {
    local attempt=1
    while [ $attempt -le 3 ]; do
        TOKEN=$(curl -s 'https://www.deezer.com/ajax/gw-light.php?method=deezer.getUserData&api_version=1.0&input=3' \
          -X POST \
          -H "Cookie: arl=${ARL}; dzlang=en" \
          -H 'Content-Type: text/plain;charset=UTF-8' \
          -H 'Accept: application/json, text/plain, */*' \
          -H 'X-Requested-With: XMLHttpRequest' \
          -H 'Origin: https://www.deezer.com' \
          -H 'Referer: https://www.deezer.com/' \
          -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0' \
          --data '{"api_token":"null"}' 2>/dev/null | jq -r '.results.checkForm')
        
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            return 0
        fi
        
        attempt=$((attempt + 1))
        [ $attempt -le 3 ] && sleep 1
    done
    return 1
}

# Função para adicionar tracks
add_batch() {
    local batch_tracks="$1"
    local batch_num="$2"
    
    local response=$(curl -s 'https://www.deezer.com/ajax/gw-light.php?method=playlist.addSongs&api_version=1.0&input=3' \
      -X POST \
      -H "Cookie: arl=${ARL}; dzlang=en" \
      -H "Content-Type: text/plain;charset=UTF-8" \
      -H "Accept: application/json, text/plain, */*" \
      -H "X-Requested-With: XMLHttpRequest" \
      -H "Origin: https://www.deezer.com" \
      -H "Referer: https://www.deezer.com/" \
      -H "User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0" \
      --data "{\"playlist_id\":${PLAYLIST_ID},\"songs\":[${batch_tracks}],\"offset\":0,\"api_token\":\"${TOKEN}\"}")
    
    if echo "$response" | jq . &>/dev/null; then
        if echo "$response" | jq -e '.error | length == 0' &>/dev/null; then
            echo "  ✓ Lote $batch_num adicionado"
            return 0
        else
            local error=$(echo "$response" | jq -r '.error | keys[0]')
            echo "  ⚠ Erro no lote $batch_num: $error"
            return 1
        fi
    else
        echo "  ❌ Resposta inválida no lote $batch_num"
        return 1
    fi
}

echo ""
echo "🎶 Adicionando faixas em lotes de $BATCH_SIZE..."
echo ""

# Obtém token antes de começar
echo "🔐 Obtendo token..."
if ! get_token; then
    echo "❌ Falha ao obter token. Verifique se o ARL está válido."
    exit 1
fi
echo "✓ Token: ${TOKEN:0:20}..."
echo ""

BATCH_NUM=0
BATCH_SONGS=""
ADDED=0
FAILED=0

for i in "${!TRACKS[@]}"; do
    BATCH_SONGS="${BATCH_SONGS}${TRACKS[$i]},"
    
    # Enviar quando atingir BATCH_SIZE ou última faixa
    if (( (i + 1) % BATCH_SIZE == 0 )) || (( i == TOTAL_TRACKS - 1 )); then
        BATCH_SONGS="${BATCH_SONGS%,}"  # Remove última vírgula
        BATCH_NUM=$((BATCH_NUM + 1))
        
        if add_batch "$BATCH_SONGS" "$BATCH_NUM"; then
            ADDED=$((ADDED + ${#TRACKS[@]} < (BATCH_NUM * BATCH_SIZE) ? TOTAL_TRACKS - (BATCH_NUM - 1) * BATCH_SIZE : BATCH_SIZE))
        else
            FAILED=$((FAILED + ${#TRACKS[@]} < (BATCH_NUM * BATCH_SIZE) ? TOTAL_TRACKS - (BATCH_NUM - 1) * BATCH_SIZE : BATCH_SIZE))
            # Tenta novamente com novo token
            echo "  🔄 Obtendo novo token para retry..."
            if get_token; then
                add_batch "$BATCH_SONGS" "$BATCH_NUM (retry)" || FAILED=$((FAILED + BATCH_SIZE))
            fi
        fi
        
        BATCH_SONGS=""
        sleep 1  # Pausa entre lotes
    fi
done

echo ""
echo "================================"
echo "✅ Operação concluída!"
echo "📊 Total processado: $TOTAL_TRACKS"
echo "🎵 Adicionadas: ~$ADDED"
echo "Playlist: https://www.deezer.com/playlist/$PLAYLIST_ID"
