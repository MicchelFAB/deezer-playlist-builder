"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var readline = require("readline");
var fs = require("fs");
var minimist = require("minimist");
var deezerClient = require("./DeezerClient");
// register your app on Deezer Developers portal
// https://developers.deezer.com/myapps
var appId = "";
var appSecret = "";
var argv = minimist(process.argv.slice(2));
if (!argv.inputFile) {
    console.log("Missing argument -inputFile path");
    process.exit(-1);
}
if (!argv.playlistName) {
    console.log("Missing argument -playlistName");
    process.exit(-1);
}
var artists = [];
var allTracks = [];
var deezer = new deezerClient.DeezerClient(appId, appSecret);
// Modo de busca apenas - não precisa de autenticação
console.log("=== Deezer Playlist Builder - Search Mode ===");
console.log("Nota: Como o Deezer não permite novos registros de app,");
console.log("este programa vai listar as músicas que seriam adicionadas.\n");
importArtistsAndList();
function importArtistsAndList() {
    // open the file given as parameter and read it line by line
    var rl = readline.createInterface({ input: fs.createReadStream(argv.inputFile) });
    rl.on('line', function (line) {
        var trimmedLine = line.trim();
        if (trimmedLine) {
            artists.push(trimmedLine);
        }
    });
    // when we read end of file, search for all artists and their albums
    rl.on('close', function () {
        console.log("Ready to search " + artists.length + " artist(s)");
        var i = 0;
        function processArtist() {
            if (i >= artists.length) {
                // All artists processed, show summary
                console.log("\n=================================================");
                console.log("RESUMO - Total de " + allTracks.length + " música(s) encontradas");
                console.log("=================================================\n");
                // Agrupar por artista
                var tracksByArtist_1 = {};
                allTracks.forEach(function (track) {
                    var artistName = track.artist ? track.artist.name : "Desconhecido";
                    if (!tracksByArtist_1[artistName]) {
                        tracksByArtist_1[artistName] = [];
                    }
                    tracksByArtist_1[artistName].push(track);
                });
                // Mostrar estatísticas
                Object.keys(tracksByArtist_1).forEach(function (artistName) {
                    console.log(artistName + ": " + tracksByArtist_1[artistName].length + " músicas");
                });
                console.log("\nPara criar a playlist automaticamente, você precisaria:");
                console.log("1. Ter credenciais válidas do Deezer API");
                console.log("2. Ou criar manualmente a playlist com estes IDs de tracks:");
                console.log(allTracks.map(function (t) { return t.id; }).join(","));
                return;
            }
            var artistName = artists[i];
            console.log("\n[" + (i + 1) + "/" + artists.length + "] Processing: " + artistName);
            deezer.searchArtist(artistName, function (artist) {
                if (artist) {
                    deezer.getArtistAlbums(artist.id, function (albums) {
                        if (albums.length > 0) {
                            processAlbums(albums, 0, function () {
                                i++;
                                processArtist();
                            });
                        }
                        else {
                            i++;
                            processArtist();
                        }
                    });
                }
                else {
                    i++;
                    processArtist();
                }
            });
        }
        function processAlbums(albums, albumIndex, callback) {
            if (albumIndex >= albums.length) {
                callback();
                return;
            }
            var album = albums[albumIndex];
            console.log("    Getting tracks from album: " + album.title);
            deezer.getAlbumTracks(album.id, function (tracks) {
                console.log("      -> " + tracks.length + " track(s) added");
                allTracks = allTracks.concat(tracks);
                processAlbums(albums, albumIndex + 1, callback);
            });
        }
        processArtist();
    });
}
//# sourceMappingURL=app.js.map