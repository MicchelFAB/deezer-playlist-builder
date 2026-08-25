#!/bin/bash

# ==============================================
# Setup Script - Deezer Playlist Builder
# ==============================================
# Este script ajuda a configurar o ambiente pela primeira vez

set -e

echo "🎵 Deezer Playlist Builder - Setup"
echo "====================================="
echo ""

# Verificar dependências
echo "📦 Verificando dependências..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "  ❌ $1 não encontrado"
        return 1
    else
        echo "  ✅ $1"
        return 0
    fi
}

ALL_OK=true
check_command node || ALL_OK=false
check_command npm || ALL_OK=false
check_command jq || ALL_OK=false

echo ""

if [ "$ALL_OK" = false ]; then
    echo "⚠️  Instale as dependências faltantes:"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt install nodejs npm jq"
    echo ""
    echo "macOS:"
    echo "  brew install node jq"
    echo ""
    exit 1
fi

# Instalar dependências Node
echo "📦 Instalando dependências Node.js..."
npm install
echo ""

# Criar .env.local se não existir
if [ ! -f .env.local ]; then
    echo "📝 Criando arquivo .env.local..."
    cp .env.example .env.local
    echo "  ✅ Arquivo .env.local criado"
    echo ""
    echo "⚠️  IMPORTANTE: Edite .env.local com suas credenciais!"
    echo "  nano .env.local"
    echo ""
    echo "Para obter suas credenciais:"
    echo "  1. Leia: PLAYLIST_ADDER_README.md (seção 'Obter Credenciais')"
    echo "  2. Ou execute: cat PLAYLIST_ADDER_README.md | less"
else
    echo "  ℹ️  .env.local já existe (não sobrescrito)"
    echo ""
fi

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build 2>/dev/null || npx tsc
echo "  ✅ Compilação concluída"
echo ""

# Verificar estrutura
echo "📁 Verificando estrutura do projeto..."
if [ -f "artist.txt" ]; then
    ARTIST_COUNT=$(grep -v '^$' artist.txt | wc -l)
    echo "  ✅ artist.txt ($ARTIST_COUNT artistas)"
else
    echo "  ℹ️  artist.txt não encontrado (crie com lista de artistas)"
fi

if [ -f "playlist_tracks.txt" ]; then
    echo "  ✅ playlist_tracks.txt (pronto para usar)"
else
    echo "  ℹ️  playlist_tracks.txt não encontrado (execute busca primeiro)"
fi
echo ""

# Resumo
echo "================================"
echo "✅ Setup concluído!"
echo ""
echo "📚 Próximos passos:"
echo ""
echo "1. Configure suas credenciais:"
echo "   nano .env.local"
echo ""
echo "2. Busque músicas (opcional se já tem playlist_tracks.txt):"
echo "   node search-albums.js --inputFile artist.txt --outputFile playlist_tracks.txt"
echo ""
echo "3. Adicione músicas à playlist:"
echo "   source .env.local"
echo "   ./add-tracks-manual.sh"
echo "   # OU"
echo "   ts-node add-tracks.ts --inputFile playlist_tracks.txt"
echo ""
echo "📖 Documentação completa: PLAYLIST_ADDER_README.md"
echo "================================"
