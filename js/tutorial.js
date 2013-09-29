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

        App.controller('appController', function($scope, $log, $q, trackFactory, genreFactory) {
            
            trackFactory.getStarredTracks()
                .then(function(artists) {
                    var deferred = $q.defer();                    
                    for (var i = 0; i < 5; i++) {
                        var _i = i;
                        genreFactory.getGenres(artists[i], _i).then(function(index){
                            console.log(index)
                            if(index === 4) {
                                console.log('done');
                                deferred.resolve();
                            }
                        });
                    };
                    return deferred.promise;

                })
                .then(function(what){
                    console.log('after')
                }); 
        });
        App.service('localStorageFactory', function(){
            factory = {
                /*
                data: Object
                    response: Object
                        artist: Object
                            genres: []
                */
                getArtistGenres : function(artistId){
                    var genreArr = [];

                    for (var genre in _genres) {
                        for (var i = 0; i < _genres[genre].artists.length; i++) {
                            console.log(_genres[genre].toString())
                            if(_genres[genre].artists[i] == artistId) genreArr.push(_genres[genre].toString());
                        };
                    };

                    return genreArr;
                }
            }
            return factory;

        })

        App.service('genreFactory', function($http, $q, trackFactory){


            var _genres = {},

                _init = function(){
                    console.log('init genreFactory');
                    var _oldGenres = JSON.parse(localStorage.getItem('genres'));
                    _genres = _oldGenres || {};
                    console.log(_genres)
                },

                _saveGenres = function(){
                    localStorage.setItem('genres', JSON.stringify(_genres));
                },
                _update = function(artistId, genre){
                    trackFactory.addGenre(artistId, genre);    
                },
                factory = {
                    /*
                    data: Object
                        response: Object
                            artist: Object
                                genres: []
                    */
                    getArtistGenres : function(artistId){
                        var genreArr = [];

                        for (var genre in _genres) {
                            for (var i = 0; i < _genres[genre].artists.length; i++) {
                                if(_genres[genre].artists[i] == artistId) {
                                    genreArr.push(genre.toString());
                                    _update(artistId, genre)
                                    break;
                                }
                            };
                        };
                        _saveGenres();


                        return genreArr;
                    },

                    getGenres : function(artistId, i){
                        if(factory.getArtistGenres(artistId).length > 0){
                            var deferred = $q.defer();
                            deferred.resolve(i);
                            return deferred.promise;
                        }
                        else{
                            var getURL = 'http://developer.echonest.com/api/v4/artist/profile?api_key=DXO7V5Z3LOXLCDE4M&id=spotify-WW:artist:' + artistId + '&bucket=genre'
                            return $http.get(getURL).then(function(data){
                                if(data.data.response.artist){
                                    var genresData = data.data.response.artist.genres;
                                    for(var j = 0; j < genresData.length; j++){  
                                        var genre = genresData[j].name;
                                        genre = genre.split(" ").join("_");
                                            
                                        if(!_genres.hasOwnProperty(genre)) {
                                            _genres[genre] = {
                                                'count' : 1,
                                                'artists' : [artistId],
                                                'tracks' : []  
                                            }
                                        }

                                        else{
                                            _genres[genre].count = _genres[genre].count + 1;
                                            _genres[genre].artists.push(artistId)
                                        }
                                    }
                                }
                                _genres[genre].tracks = _genres[genre].tracks.concat(trackFactory.getTracks(artistId));
                                _update(artistId, genre);
                                _saveGenres();
    
                                return i;
                            })
                        }
                    }
                }

                _init();

            return factory;
        });

        App.service('trackFactory', function($q, $rootScope){

/*          var foo = localStorage.getItem("bar");
            localStorage.setItem("bar", foo);*/

            var _library = Library.forCurrentUser(),
                _artists = {},
                _artistArr = [],

                _init = function(){
                    console.log('init trackFactory')
                },

                _saveArtists = function(){
                    localStorage.setItem('artist', JSON.stringify(_artists));
                    console.log('saved artists to localstorage')
                },
                
                factory = {
                    addGenre : function(artistId, genre){
                        _artists[artistId].genres.push(genre);
                        _saveArtists();
                    },
                    getTracks : function(artistId){
                        return _artists[artistId].tracks
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
                            for (var i = 0; i < snapshot.length; i++) {
                                snapshot.get(i).load('name').done(function(track) {
                                    if(track.starred){
                                        var trackUri = track.uri; //spotify:track:TRACKID
                                        trackUri = trackUri.substr(trackUri.lastIndexOf(':') + 1); //TRACKID;
                                        var artistsData =  track.artists;
                                        
                                        for(var j = 0; j < artistsData.length; j++){  
                                            var artistUrl = artistsData[j].uri; //spotify:artist:ARTISTID
                                            if(artistUrl.indexOf('local') < 0){
                                                artistUrl = artistUrl.substr(artistUrl.lastIndexOf(':') + 1); //ARTISTID

                                                if(!_artists.hasOwnProperty(artistUrl)) {
                                                    _artists[artistUrl] = {
                                                        'count' : 1,
                                                        'tracks' : [trackUri],
                                                        'genres' : [],
                                                        'name' : artistsData[j].name   
                                                    }
                                                    _artistArr.push(artistUrl)
                                                }

                                                else{
                                                    _artists[artistUrl].count = _artists[artistUrl].count + 1;
                                                    _artists[artistUrl].tracks.push(trackUri);
                                                }
                                            }
                                        }  
                                    }              
                                });
                            }
                            console.log('loop done')
                        }).done(function(){
                            _saveArtists();

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
        


    function getGenres(){
        var j = 0;
        var artistId = artistArr[j];

        /*$http.get('http://developer.echonest.com/api/v4/artist/profile?api_key=DXO7V5Z3LOXLCDE4M&id=spotify-WW:artist:" + artistId + "&bucket=genre"')
            .success(function(data){
                console.log(data)
            });*/

        //console.log('- artist ' + (j + 1) + ' of ' + (artistArr.length + 1);
        /*
        $.ajax({
          url: "http://developer.echonest.com/api/v4/artist/profile?api_key=DXO7V5Z3LOXLCDE4M&id=spotify-WW:artist:" + artistId + "&bucket=genre",
        }).done(function(data) {
            if(data.response.artist){
              var genresData = data.response.artist.genres;
              for(var i = 0; i < genresData.length; i++){  
                var genre = genresData[i].name;
                genre = genre.split(" ").join("_");
                        
                if(!genres.hasOwnProperty(genre)) {
                  genres[genre] = {
                  'count' : 1,
                  'artists' : [artistId],
                  'tracks' : []  
                  }
                }
                  
                else{
                  genres[genre].count = genres[genre].count + 1;
                  genres[genre].artists.push(artistId)
                }

                artists[artistId].genres.push(genre)        
                genres[genre].tracks = genres[genre].tracks.concat(artists[artistId].tracks)
              }
            }
            else console.log(artistId + ' failed')
              j++;     
              if(j < artistArr.length) getGenres();
              else console.log(genres)
        });  */
    }

}); // require
