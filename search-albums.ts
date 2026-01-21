import readline = require("readline");
import fs = require("fs");
import minimist = require("minimist");
import request = require("request");

var argv = <any>minimist(process.argv.slice(2));
if (!argv.inputFile) {
    console.log("Missing argument -inputFile path");
    console.log("Usage: node search-albums.js --inputFile artist.txt [--outputFile output.txt]");
    process.exit(-1);
}

var outputFile = argv.outputFile || "playlist_tracks.txt";
var artists: string[] = [];
var allTracks: any[] = [];
var seenTrackIds = new Set<string>();

// normalize names for strict comparison (case/spacing insensitive)
function normalizeName(name: string): string {
    return (name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

console.log("=== Deezer Album Search ===\n");
importArtists();

function importArtists() {
    var rl = readline.createInterface(<any>{ input: fs.createReadStream(argv.inputFile) });
    rl.on('line', line => { 
        const trimmedLine = line.trim();
        if (trimmedLine) {
            artists.push(trimmedLine); 
        }
    });

    rl.on('close', () => {
        console.log("Ready to search " + artists.length + " artist(s)\n");
        var i = 0;
        
        function processArtist() {
            if (i >= artists.length) {
                saveTracksToFile();
                return;
            }
            
            var artistName = artists[i];
            console.log("[" + (i + 1) + "/" + artists.length + "] " + artistName);
            
            searchArtist(artistName, (artist) => {
                if (artist) {
                    getArtistAlbums(artist.id, (albums) => {
                        if (albums.length > 0) {
                            console.log("  -> " + albums.length + " album(s) found");
                            processAlbums(albums, 0, () => {
                                i++;
                                processArtist();
                            });
                        } else {
                            console.log("  -> No albums found");
                            i++;
                            processArtist();
                        }
                    });
                } else {
                    console.log("  -> Artist not found");
                    i++;
                    processArtist();
                }
            });
        }
        
        function processAlbums(albums: any[], albumIndex: number, callback: Function) {
            if (albumIndex >= albums.length) {
                callback();
                return;
            }
            
            const album = albums[albumIndex];
            
            getAlbumTracks(album.id, (tracks) => {
                console.log("     📀 " + album.title + " (" + tracks.length + " tracks)");
                tracks.forEach((t: any) => {
                    if (t && t.id && !seenTrackIds.has(String(t.id))) {
                        seenTrackIds.add(String(t.id));
                        allTracks.push(t);
                    }
                });
                processAlbums(albums, albumIndex + 1, callback);
            });
        }
        
        processArtist();
    });
}

function searchArtist(artistName: string, callback: Function) {
    const url = "http://api.deezer.com/search/artist?q=" + encodeURIComponent(artistName);
    request.get(url, (error, response, body) => {
        if (error) {
            callback(null);
            return;
        }
        var result = JSON.parse(body);
        if (result.total > 0 && result.data) {
            const target = normalizeName(artistName);
            const candidate = result.data.find((a: any) => normalizeName(a.name || "") === target);
            callback(candidate || null);
        } else {
            callback(null);
        }
    });
}

function getArtistAlbums(artistId: string, callback: Function) {
    const url = "http://api.deezer.com/artist/" + artistId + "/albums";
    request.get(url, (error, response, body) => {
        if (error) {
            callback([]);
            return;
        }
        var result = JSON.parse(body);
        if (result.data && result.data.length > 0) {
            callback(result.data);
        } else {
            callback([]);
        }
    });
}

function getAlbumTracks(albumId: string, callback: Function) {
    const url = "http://api.deezer.com/album/" + albumId;
    request.get(url, (error, response, body) => {
        if (error) {
            callback([]);
            return;
        }
        var result = JSON.parse(body);
        if (result.tracks && result.tracks.data) {
            callback(result.tracks.data);
        } else {
            callback([]);
        }
    });
}

function saveTracksToFile() {
    console.log("\n" + "=".repeat(70));
    console.log("📊 SUMMARY");
    console.log("=".repeat(70));
    console.log("Total tracks found: " + allTracks.length);
    console.log("=".repeat(70) + "\n");
    
    // Group by artist
    const tracksByArtist: any = {};
    allTracks.forEach(track => {
        const artistName = track.artist ? track.artist.name : "Unknown";
        if (!tracksByArtist[artistName]) {
            tracksByArtist[artistName] = [];
        }
        tracksByArtist[artistName].push(track);
    });
    
    console.log("Tracks by artist:");
    Object.keys(tracksByArtist).forEach(artistName => {
        console.log("  • " + artistName + ": " + tracksByArtist[artistName].length + " tracks");
    });
    
    // Save to file
    var output = "";
    output += "# Deezer Playlist Export\n";
    output += "# Generated: " + new Date().toISOString() + "\n\n";
    output += "Total tracks: " + allTracks.length + "\n\n";
    
    output += "## Track IDs (for Deezer API)\n";
    output += "```\n";
    output += allTracks.map(t => t.id).join(",") + "\n";
    output += "```\n\n";
    
    output += "## Complete Track List\n\n";
    allTracks.forEach((track, index) => {
        output += (index + 1) + ". **" + track.artist.name + "** - " + track.title + "\n";
        output += "   - Album: " + (track.album ? track.album.title : "N/A") + "\n";
        output += "   - Duration: " + Math.floor(track.duration / 60) + ":" + (track.duration % 60).toString().padStart(2, '0') + "\n";
        output += "   - Link: https://www.deezer.com/track/" + track.id + "\n";
        output += "   - ID: `" + track.id + "`\n\n";
    });
    
    fs.writeFileSync(outputFile, output, 'utf8');
    console.log("\n✅ Results saved to: " + outputFile);
    console.log("\n💡 You can:");
    console.log("   - View the complete list in the output file");
    console.log("   - Manually add tracks using the Deezer web interface");
    console.log("   - Use the track IDs with Deezer API if you get app credentials\n");
}
