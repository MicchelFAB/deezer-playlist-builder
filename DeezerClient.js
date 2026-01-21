"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeezerClient = void 0;
var open = require("open");
var express = require("express");
var request = require("request");
var querystring = require("querystring");
var util = require("util");
var DeezerClient = /** @class */ (function () {
    function DeezerClient(appId, appSecret, accessToken) {
        var _this = this;
        this.perms = "basic_access,email,manage_library";
        this.redirectUrl = "http://localhost:5000/deezer-auth";
        this.portNumber = 5000;
        this.authUrl = "https://connect.deezer.com/oauth/auth.php?app_id=%s&redirect_uri=%s&perms=%s";
        this.tokenUrl = "https://connect.deezer.com/oauth/access_token.php?app_id=%s&secret=%s&code=%s";
        this.createPlaylistUrl = "http://api.deezer.com/user/me/playlists?access_token=%s&title=%s";
        this.playlistUrl = "http://api.deezer.com/playlist/%s/tracks?access_token=%s&songs=%s";
        this.playlistOpenUrl = "http://www.deezer.com/playlist/%s";
        this.searchUrl = "http://api.deezer.com/search?q=artist:\"%s\" track:\"%s\"";
        this.artistSearchUrl = "http://api.deezer.com/search/artist?q=%s";
        this.artistAlbumsUrl = "http://api.deezer.com/artist/%s/albums";
        this.login = function (callback) {
            if (_this.accessToken) {
                callback();
                return;
            }
            // setup an express web server because during auth, we need to have a redirect url
            // in this case, it will be on localhost :-)
            var app = express();
            app.get("/deezer-auth", function (req, res) {
                if (req.query.code) {
                    res.send("Deezer authentication OK, you can close this window");
                    var url_1 = util.format(_this.tokenUrl, _this.appId, _this.appSecret, req.query.code);
                    request.get(url_1, function (error, response, body) {
                        var content = querystring.parse(body);
                        _this.accessToken = content.access_token;
                        callback();
                    });
                }
                else {
                    res.send("Deezer authentication KO");
                    callback();
                }
            });
            app.listen(_this.portNumber, function () {
            });
            var url = util.format(_this.authUrl, _this.appId, _this.redirectUrl, _this.perms);
            open(url);
        };
        this.createPlaylist = function (playlistName, callback) {
            var url = util.format(_this.createPlaylistUrl, _this.accessToken, playlistName);
            request.post(url, { method: "POST" }, function (error, response, body) {
                if (!error && response.statusCode === 200 && body) {
                    callback(JSON.parse(body).id);
                }
                else {
                    callback(null);
                }
            });
        };
        this.search = function (track, callback) {
            console.log("Searching for artist: " + track.artist + " title: " + track.title);
            var url = util.format(_this.searchUrl, track.artist, track.title);
            request.get(url, function (error, response, body) {
                var result = JSON.parse(body);
                if (result.total > 0 && result.data) {
                    // for now, we use only the first item as result - that could be improved
                    track.track = result.data[0];
                    console.log("  -> Found !");
                }
                else {
                    console.log("  -> No match");
                }
                callback();
            });
        };
        this.addTrackToPlaylist = function (tracks, playlistId) {
            var ids = "";
            for (var i = 0; i < tracks.length; i++) {
                if (tracks[i].track) {
                    ids += tracks[i].track.id + ",";
                }
            }
            var url = util.format(_this.playlistUrl, playlistId, _this.accessToken, ids);
            request.post(url, { method: "POST" }, function (error, response, body) {
                open(util.format(_this.playlistOpenUrl, playlistId));
            });
        };
        this.searchArtist = function (artistName, callback) {
            console.log("Searching for artist: " + artistName);
            var url = util.format(_this.artistSearchUrl, encodeURIComponent(artistName));
            request.get(url, function (error, response, body) {
                var result = JSON.parse(body);
                if (result.total > 0 && result.data) {
                    var artist = result.data[0];
                    console.log("  -> Found artist: " + artist.name + " (ID: " + artist.id + ")");
                    callback(artist);
                }
                else {
                    console.log("  -> No match");
                    callback(null);
                }
            });
        };
        this.getArtistAlbums = function (artistId, callback) {
            var url = util.format(_this.artistAlbumsUrl, artistId);
            request.get(url, function (error, response, body) {
                var result = JSON.parse(body);
                if (result.data && result.data.length > 0) {
                    console.log("  -> Found " + result.data.length + " album(s)");
                    callback(result.data);
                }
                else {
                    console.log("  -> No albums found");
                    callback([]);
                }
            });
        };
        this.getAlbumTracks = function (albumId, callback) {
            var url = util.format("http://api.deezer.com/album/%s", albumId);
            request.get(url, function (error, response, body) {
                var result = JSON.parse(body);
                if (result.tracks && result.tracks.data) {
                    callback(result.tracks.data);
                }
                else {
                    callback([]);
                }
            });
        };
        this.appSecret = appSecret;
        this.appId = appId;
        // accessToken is optional and can be set for testing purpose
        this.accessToken = accessToken;
    }
    return DeezerClient;
}());
exports.DeezerClient = DeezerClient;
//# sourceMappingURL=DeezerClient.js.map