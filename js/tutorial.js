/* Code by Erik Portin
*
*
**/

    // include angular loader, which allows the files to load in any order
    /*
     AngularJS v1.0.7
     (c) 2010-2012 Google, Inc. http://angularjs.org
     License: MIT
    */
    (function(i){'use strict';function d(c,b,e){return c[b]||(c[b]=e())}return d(d(i,"angular",Object),"module",function(){var c={};return function(b,e,f){e&&c.hasOwnProperty(b)&&(c[b]=null);return d(c,b,function(){function a(a,b,d){return function(){c[d||"push"]([a,b,arguments]);return g}}if(!e)throw Error("No module: "+b);var c=[],d=[],h=a("$injector","invoke"),g={_invokeQueue:c,_runBlocks:d,requires:e,name:b,provider:a("$provide","provider"),factory:a("$provide","factory"),service:a("$provide","service"),
    value:a("$provide","value"),constant:a("$provide","constant","unshift"),filter:a("$filterProvider","register"),controller:a("$controllerProvider","register"),directive:a("$compileProvider","directive"),config:h,run:function(a){d.push(a);return this}};f&&h(f);return g})}})})(window);

require([
        '$api/models',
        '$views/buttons',
        '$views/list#List',
        '$views/image#Image',
        '$api/library#Library',
        'js/angular.min'
        ], function(models, buttons, List, Image, Library, Angular) {

        var App = angular.module('genreApp', []);

        App.controller('appController', function($scope, $log, $q, artistFactory, genreFactory) {
            var _artists = {},
                _genres = {},
                _buildPlayList = function(genres){
                    console.log('build')
                    var artistsAdded = {};


                    models.Playlist.create('genre playlist [' + genres[0].name + ']').done(function(playlist) {
                        models.Playlist.fromURI(playlist.uri)
                        .load(['tracks'])
                        .done(function(p){
                            for (var i = 0; i < genres.length; i++) {
                                var artists = _genres[genres[i].id].artists;
                                for (var j = 0; j < artists.length; j++) {
                                    if(!artistsAdded.hasOwnProperty(artists[j])){
                                        var tracks = _artists[artists[j]].tracks;
                                        for (var k = 0; k < tracks.length; k++) {
                                            var track = models.Track.fromURI('spotify:track:' + tracks[k]);
                                            p.tracks.add(track)
                                        };
                                        artistsAdded[artists[j]] = 'added';                                
                                    }

                                };
                            };
                        })
                    });

                },
                _unselectAll = function(genres){
                    for (var i = 0; i < $scope.genreArr.length; i++) {
                        for (var j = 0; j < genres.length; j++) {
                            if($scope.genreArr[i] == genres[j]){
                                $scope.genreArr[i].checked = 'false';
                                break;
                            }
                        };
                    }
                },
                _selectAll = function(genres){
                    console.log(genres)
                    for (var i = 0; i < $scope.genreArr.length; i++) {
                        for (var j = 0; j < genres.length; j++) {
                            if($scope.genreArr[i] == genres[j]){
                                $scope.genreArr[i].checked = 'true';
                                break;
                            }
                        };
                    }
                }
            
            $scope.buildPlaylist = _buildPlayList;    
            $scope.selectAll = _selectAll;    
            $scope.unselectAll = _unselectAll;

            $scope.status = 'Loading genres...';

            artistFactory.getStarredTracks()
                .then(function(artists) {
                    var deferred = $q.defer();

                    //get genres for X first artists
                    var size = artists.length;                    
                    for (var i = 0; i < size; i++) {
                        var _i = i;
                        $scope.status = 'Loading genres... ' + _i + '/ 160';
                        genreFactory.getGenres(artists[i], _i).then(function(index){
                            if(index === size - 1) {
                                deferred.resolve();
                            }
                        });
                    };
                    return deferred.promise;

                })
                /*.then(function(){
                    console.log('get undefined')
                    var deferred = $q.defer(),
                        undefinedArtists = genreFactory.getUndefinedArtists();

                    //get genres for X first artists                    
                    for (var i = 0; i < 5; i++) {
                        var _i = i;
                        genreFactory.getGenresFromEchoNest(undefinedArtists[i], _i).then(function(index){
                            if(index === 5 - 1) {
                                deferred.resolve();
                            }
                        });
                    };
                    return deferred.promise;
                })*/
                .then(function(what){
                    console.log('got all data');
                    $scope.status = ''
                    //got all data. Let's start assign variables to the scope.

                    _artists = artistFactory.getArtists(),
                    _genres = genreFactory.getGenresObject();

                    var genreArr = genreFactory.getGenreArr();
                    $scope.genreArr = genreArr;
                }); 
        });

        App.service('genreFactory', function($rootScope, $http, $q, artistFactory){


            var _genres = {},
                _undefinedArtists = [],

                _init = function(){
                    //get genres from localstorage
                    var _oldGenres = JSON.parse(localStorage.getItem('genres'));
                    _genres = _oldGenres || {};
                },

                _saveGenres = function(){
                    localStorage.setItem('genres', JSON.stringify(_genres));
                },

                _updateArtist = function(artistId, genre){
                    artistFactory.addGenre(artistId, genre);    
                },

                _addGenres = function(genresData){
                    for(var j = 0; j < genresData.length; j++){
                        var genre = genresData[j].name || genresData[j];

                        //remove spaces
                        genre = genre.split(" ").join("_");
                        

                        //if doesn't exist already add it to _genres object
                        if(!_genres.hasOwnProperty(genre)) {
                            _genres[genre] = {
                                'artists' : [artistId],
                            }
                        }

                        //if genre exists add artist id
                        else{
                            _genres[genre].artists.push(artistId)
                        }
                    }


                    // if no genre found empty array returned. Therefore need to test if genre was created.
                    if(_genres[genre]){

                        //update the artist object by adding the genre
                        _updateArtist(artistId, genre);

                        //save new genre to localstorage
                        _saveGenres();                                        
                    } 
                },

                factory = {
                    /*
                    data: Object
                        response: Object
                            artist: Object
                                genres: []
                    */
                    getGenreArr : function(){
                        var genreArr = [];
                        for (var genre in _genres) {
                            var name = genre.split("_").join(" ");
                            genreArr.push({name : name, id : genre, checked : 'false'});
                        }
                        return genreArr;    
                    },

                    getUndefinedArtists : function(){
                        return _undefinedArtists;
                    },

                    getArtistGenres : function(artistId){
                        var genreArr = [];

                        /*
                            check if genre got artist
                        */

                        for (var genre in _genres) {
                            // each artist for a genre
                            for (var i = 0; i < _genres[genre].artists.length; i++) {
                                if(_genres[genre].artists[i] == artistId) {
                                    //add each genre to the genreArr
                                    genreArr.push(genre.toString());

                                    //update the artist object by adding the genre
                                    _updateArtist(artistId, genre)
                                    
                                }
                            };
                        };

                        return genreArr;
                    },

                    getGenresObject : function(){
                        return _genres;
                    },

                    getGenresFromEchoNest : function(artistId, i){
                        var getURL = 'http://developer.echonest.com/api/v4/artist/profile?api_key=DXO7V5Z3LOXLCDE4M&id=spotify-WW:artist:' + artistId + '&bucket=genre'
                        return $http.get(getURL).then(function(data){
                            console.log(data)
                            console.log('calling echo')

                            if(data.data.response.artist){
                                var genresData = data.data.response.artist.genres;
                                _addGenres(genresData);
                            }
                            
                            //return index so we can continue looping
                            return i;
                        })
                    },

                    getGenres : function(artistId, i){
                        var deferred = $q.defer();

                        if(factory.getArtistGenres(artistId).length > 0){
                            deferred.resolve(i);
                        }

                        else {
                            models.Artist.fromURI('spotify:artist:' + artistId)
                                .load(['name', 'genres', 'years'])
                                .done(function(artists){
                                    if(artists.genres.length > 0){
                                        console.log('From spotify')
                                        _addGenres(artists.genres);

                                        $rootScope.$apply(function(){
                                            deferred.resolve(i);
                                        });
                                    }
                                    else{
                                        console.log('added to undefined')
                                        _undefinedArtists.push(artistId);
                                        $rootScope.$apply(function(){
                                            deferred.resolve(i);
                                        });
                                    }
                                })
                        }
                        return deferred.promise;
    
                    }
                }

                _init();

            return factory;
        });

        App.service('artistFactory', function($q, $rootScope){

            var _library = Library.forCurrentUser(),
                _artists = {}, 
                _artistArr = [],

                _init = function(){
                    console.log('init artistFactory')
                },

                _saveArtists = function(){
                    localStorage.setItem('artist', JSON.stringify(_artists));
                },
                
                factory = {
                    addGenre : function(artistId, genre){
                        _artists[artistId].genres.push(genre);
                        _saveArtists();
                    },
                    getTracks : function(artistId){
                        return _artists[artistId].tracks
                    },
                    getArtists : function(){
                        return _artists;
                    },
                    getArtistsArray : function(){
                        return _artistArr;
                    },
                    getArtistsArrayFromLocalStorage : function(){

                    },
                    getStarredTracks : function(){
                        var deferred = $q.defer();
                        /*
                            Would rather use starred property but is of type Playlist rather than Collection and therefor doesn't support snapshot() 
                        */
                        _library.tracks.snapshot().done(function(snapshot) {
                            console.log('lib')
                            for (var i = 0; i < snapshot.length; i++) {
                                snapshot.get(i).load('name').done(function(track) {
                                    //only get starred tracks
                                    if(track.starred){
                                        var trackUri = track.uri; //spotify:track:TRACKID
                                        trackUri = trackUri.substr(trackUri.lastIndexOf(':') + 1); //TRACKID;
                                        var artistsData =  track.artists;
                                        
                                        for(var j = 0; j < artistsData.length; j++){  
                                            var artistUrl = artistsData[j].uri; //spotify:artist:ARTISTID
                                            if(artistUrl.indexOf('local') < 0){ //make sure it's not a local file
                                                
                                                artistUrl = artistUrl.substr(artistUrl.lastIndexOf(':') + 1); //ARTISTID

                                                //if artist not already exists
                                                if(!_artists.hasOwnProperty(artistUrl)) {
                                                    _artists[artistUrl] = {
                                                        'tracks' : [trackUri],
                                                        'genres' : [],
                                                        'name' : artistsData[j].name   
                                                    }
                                                    _artistArr.push(artistUrl) // add each artist once to _artistArr
                                                }

                                                else{
                                                    //if artist already been added, add track
                                                    _artists[artistUrl].tracks.push(trackUri);
                                                }
                                            }
                                        }  
                                    }              
                                });
                            }
                        }).done(function(){
                            //_saveArtists(); //save to localstorage, not sure why yet

                            $rootScope.$apply(function(){
                                deferred.resolve(factory.getArtistsArray());
                            })
                        });
                        return deferred.promise;;
                    }
            }

            _init();

            return factory;
        }); 

    
        angular.bootstrap(document.body , ['genreApp']); 
    

}); // require
