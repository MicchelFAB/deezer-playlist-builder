#!/usr/bin/env ts-node

/**
 * Deezer Playlist Track Adder - TypeScript Version
 * 
 * Integração do processo de adicionar músicas à playlist usando a API privada do Deezer
 * Usa o mesmo método descoberto no script bash, mas com melhor estrutura e type safety
 */

import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

interface DeezerConfig {
    apiToken: string;
    userId: string;
    cookieString: string;
    playlistId: string;
}

interface AddTracksOptions {
    inputFile: string;
    batchSize?: number;
    delayMs?: number;
}

interface AddTracksResponse {
    error?: Record<string, string>;
    results?: any;
}

class DeezerPlaylistAdder {
    private config: DeezerConfig;
    private readonly API_URL = 'https://www.deezer.com/ajax/gw-light.php';
    
    constructor(config: DeezerConfig) {
        this.config = config;
    }

    /**
     * Gera um CID aleatório (9 dígitos) para cada requisição
     */
    private generateCID(): string {
        return Math.floor(Math.random() * 900000000 + 100000000).toString();
    }

    /**
     * Extrai track IDs do arquivo de saída do search-albums
     */
    private extractTrackIds(filePath: string): string[] {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        let inTrackIdsSection = false;
        const trackIds: string[] = [];
        
        for (const line of lines) {
            if (line.trim() === '## Track IDs') {
                inTrackIdsSection = true;
                continue;
            }
            if (line.trim().startsWith('## ')) {
                inTrackIdsSection = false;
            }
            if (inTrackIdsSection && line.trim()) {
                // Extrair IDs da linha (formato: "id,id,id,...")
                const ids = line.split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id));
                trackIds.push(...ids);
            }
        }
        
        return trackIds;
    }

    /**
     * Formata track IDs no formato esperado pela API: [["id",0], ["id",0], ...]
     */
    private formatSongs(trackIds: string[]): string[][] {
        return trackIds.map(id => [id, "0"]);
    }

    /**
     * Adiciona um lote de músicas à playlist
     */
    private async addBatch(trackIds: string[], batchNumber: number): Promise<boolean> {
        const cid = this.generateCID();
        const songs = this.formatSongs(trackIds);
        
        const requestBody = JSON.stringify({
            playlist_id: this.config.playlistId,
            songs: songs,
            offset: -1,
            ctxt: {
                id: this.config.playlistId,
                t: "playlist_assistant",
                dc: "suggested-from-recently-listen-tracks"
            }
        });

        const url = new URL(this.API_URL);
        url.searchParams.append('method', 'playlist.addSongs');
        url.searchParams.append('input', '3');
        url.searchParams.append('api_version', '1.0');
        url.searchParams.append('api_token', this.config.apiToken);
        url.searchParams.append('cid', cid);

        return new Promise((resolve, reject) => {
            const options = {
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Content-Type': 'text/plain;charset=UTF-8',
                    'Referer': `https://www.deezer.com/us/playlist/${this.config.playlistId}`,
                    'x-deezer-user': this.config.userId,
                    'Origin': 'https://www.deezer.com',
                    'Cookie': this.config.cookieString,
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            };

            const req = https.request(url.toString(), options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response: AddTracksResponse = JSON.parse(data);
                        
                        if (response.error && Object.keys(response.error).length > 0) {
                            const errorKey = Object.keys(response.error)[0];
                            console.log(`  ⚠ Erro no lote ${batchNumber}: ${errorKey}`);
                            resolve(false);
                        } else {
                            console.log(`  ✓ Lote ${batchNumber} adicionado (${trackIds.length} músicas)`);
                            resolve(true);
                        }
                    } catch (e) {
                        console.error(`  ✗ Erro ao processar resposta do lote ${batchNumber}:`, e);
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`  ✗ Erro na requisição do lote ${batchNumber}:`, error);
                resolve(false);
            });

            req.write(requestBody);
            req.end();
        });
    }

    /**
     * Adiciona todas as músicas do arquivo em lotes
     */
    async addTracksFromFile(options: AddTracksOptions): Promise<void> {
        const batchSize = options.batchSize || 50;
        const delayMs = options.delayMs || 1000;
        
        console.log('🎵 Deezer Playlist Batch Adder (TypeScript)');
        console.log('===========================================');
        console.log(`Playlist ID: ${this.config.playlistId}`);
        console.log(`Token: ${this.config.apiToken.substring(0, 20)}...`);
        console.log('');

        // Extrair IDs
        console.log('📂 Extraindo IDs...');
        const trackIds = this.extractTrackIds(options.inputFile);
        console.log(`✓ Total: ${trackIds.length} faixas`);
        console.log('');

        if (trackIds.length === 0) {
            console.log('⚠ Nenhuma música encontrada no arquivo');
            return;
        }

        // Processar em lotes
        console.log(`🎶 Adicionando em lotes de ${batchSize}...`);
        let added = 0;
        let failed = 0;
        
        for (let i = 0; i < trackIds.length; i += batchSize) {
            const batch = trackIds.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            
            const success = await this.addBatch(batch, batchNum);
            
            if (success) {
                added += batch.length;
            } else {
                failed += batch.length;
            }
            
            // Delay entre lotes (exceto no último)
            if (i + batchSize < trackIds.length) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        console.log('');
        console.log('================================');
        console.log('✅ Processo finalizado!');
        console.log(`📊 Total processado: ${trackIds.length}`);
        console.log(`🎵 Adicionadas: ~${added}`);
        console.log(`⚠ Falhas: ${failed}`);
        console.log(`Playlist: https://www.deezer.com/playlist/${this.config.playlistId}`);
    }
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    
    // Parse argumentos
    const getArg = (name: string): string | undefined => {
        const index = args.indexOf(name);
        return index !== -1 && args[index + 1] ? args[index + 1] : undefined;
    };

    const inputFile = getArg('--inputFile') || getArg('-i');
    const playlistId = getArg('--playlistId') || getArg('-p');
    const batchSize = parseInt(getArg('--batchSize') || getArg('-b') || '50');

    // Validar argumentos e variáveis de ambiente
    if (!inputFile) {
        console.error('Erro: --inputFile é obrigatório');
        console.error('\nUso:');
        console.error('  ts-node add-tracks.ts --inputFile playlist_tracks.txt [--playlistId ID] [--batchSize 50]');
        console.error('\nVariáveis de ambiente necessárias:');
        console.error('  DEEZER_API_TOKEN     - Token da API (obrigatório)');
        console.error('  DEEZER_USER_ID       - Seu User ID (obrigatório)');
        console.error('  DEEZER_COOKIES       - String completa dos cookies (obrigatório)');
        console.error('  DEEZER_PLAYLIST_ID   - ID da playlist (opcional se usar --playlistId)');
        process.exit(1);
    }

    const config: DeezerConfig = {
        apiToken: process.env.DEEZER_API_TOKEN || '',
        userId: process.env.DEEZER_USER_ID || '',
        cookieString: process.env.DEEZER_COOKIES || '',
        playlistId: playlistId || process.env.DEEZER_PLAYLIST_ID || ''
    };

    // Validar configuração
    if (!config.apiToken || !config.userId || !config.cookieString || !config.playlistId) {
        console.error('Erro: Variáveis de ambiente não configuradas!');
        console.error('\nDefina as seguintes variáveis:');
        console.error('  export DEEZER_API_TOKEN="seu_token"');
        console.error('  export DEEZER_USER_ID="seu_user_id"');
        console.error('  export DEEZER_COOKIES="string_completa_dos_cookies"');
        console.error('  export DEEZER_PLAYLIST_ID="sua_playlist_id"');
        console.error('\nOu use: source .env.local');
        process.exit(1);
    }

    // Executar
    const adder = new DeezerPlaylistAdder(config);
    adder.addTracksFromFile({ 
        inputFile, 
        batchSize 
    }).catch(error => {
        console.error('Erro fatal:', error);
        process.exit(1);
    });
}

export { DeezerPlaylistAdder, DeezerConfig, AddTracksOptions };
