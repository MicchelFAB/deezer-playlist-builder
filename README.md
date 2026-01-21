# Deezer Playlist Builder

🎵 Ferramenta completa para criar e popular playlists do Deezer automaticamente a partir de listas de artistas.

## 📖 Visão Geral

Este projeto oferece duas funcionalidades principais:

1. **Busca de Músicas**: Busca todos os álbuns de uma lista de artistas usando a API pública do Deezer
2. **Adição em Lote**: Adiciona milhares de músicas à uma playlist usando a API privada do Deezer

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Buscar músicas de artistas
node search-albums.js --inputFile artist.txt --outputFile playlist_tracks.txt

# 3. Configurar credenciais (veja documentação completa)
source .env.local

# 4. Adicionar à playlist
./add-tracks-manual.sh
# OU
ts-node add-tracks.ts --inputFile playlist_tracks.txt
```

## 📚 Documentação Completa

Para instruções detalhadas sobre:
- Como obter credenciais do navegador
- Configuração de variáveis de ambiente
- Troubleshooting
- Especificações técnicas da API

**Leia**: [PLAYLIST_ADDER_README.md](PLAYLIST_ADDER_README.md)

## 🛠️ Ferramentas Disponíveis

### 1. search-albums.ts/js
Busca músicas usando a API pública (não requer autenticação)

```bash
node search-albums.js --inputFile artist.txt --outputFile playlist_tracks.txt
```

### 2. add-tracks-manual.sh
Script Bash para adicionar músicas em lote

```bash
export DEEZER_API_TOKEN="..."
export DEEZER_USER_ID="..."
export DEEZER_COOKIES="..."
./add-tracks-manual.sh
```

### 3. add-tracks.ts
Versão TypeScript integrada com type safety

```bash
ts-node add-tracks.ts --inputFile playlist_tracks.txt
```

## 📋 Requisitos

- Node.js 12+
- TypeScript (para desenvolvimento)
- jq (para script bash)
- Conta Deezer ativa

## 🔧 Build

```bash
# Instalar TypeScript
npm install -g typescript

# Instalar dependências
npm install

# Compilar
npm run build
```

## ⚠️ Aviso Importante

Este projeto usa a API privada do Deezer para adicionar músicas, pois a API pública não permite mais registros de novos apps. Use por sua conta e risco.

**NUNCA commite arquivos com credenciais reais!**

## 📝 Licença

MIT - Veja LICENSE para detalhes

# Misc

* Built with Visual Studio Code