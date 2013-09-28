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

        App.controller('appController', function($scope, $log, genreFactory, trackFactory) {


            console.log('start')

            trackFactory.getStarredTracks().done(function(){
                console.log(trackFactory.getArtists())
                var getPromise = genreFactory.getGenres('0UOrN3LNaKApiOSdvJiETl');
                // Notice that we're getting a single promise back but we're hooking up multiple different things to it (via a
                // call to .then() and assigning it to a $scope value. Try that with a regular callback...
                getPromise.then(function (response) {
                    $log.log("Success", response.response.artist);
                    $scope.test = response.response.artist.name;
                }, function (response) {
                  $log.log("Error", response);
                });
            });


        });

        App.service('genreFactory', function($http){
            var _genres = {},
                factory = {
                getGenres : function(artistId){
                    var getURL = 'http://developer.echonest.com/api/v4/artist/profile?api_key=DXO7V5Z3LOXLCDE4M&id=spotify-WW:artist:' + artistId + '&bucket=genre'
                    return $http.get(getURL, {
                      "params": {
                        "callback": "JSON_CALLBACK"
                      }}).then(
                        function (response) {
                          // In this case we'll dig out the value we actually want and use that to resolve the promise which .then()
                          // has created for us.
                          return response.data;
                        }
                    );
                }
            };
            return factory;
        });

        App.service('trackFactory', function(){
            var _library = Library.forCurrentUser(),
                _artists = {},
                _artistArr = [],
                factory = {
                    getArtists : function(){
                        return _artists;
                    },
                    getStarredTracks : function(){
                        /*
                            Would rather use starred property but is of type Playlist rather than Collection and therefor doesn't support snapshot() 
                        */
                        return _library.tracks.snapshot().done(function(snapshot) {
                            for (var i = 0; i < 20; i++) {
                                snapshot.get(i).load('name').done(function(track) {
                                    if(track.starred){
                                        var trackUri = track.uri; //spotify:track:TRACKID
                                        trackUri = trackUri.substr(trackUri.lastIndexOf(':') + 1); //TRACKID;
                                        var artistsData =  track.artists;
                                        
                                        for(var j = 0; j < artistsData.length; j++){  
                                          var artistUrl = artistsData[j].uri; //spotify:artist:ARTISTID
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
                                });
                            }
                        }).done(
                            function (response) {
                              // In this case we'll dig out the value we actually want and use that to resolve the promise which .then()
                              // has created for us.
                              return response.data;
                            }
                        );
                    }
            }
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
