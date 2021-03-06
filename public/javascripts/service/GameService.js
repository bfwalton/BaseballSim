var GameService = App.service('GameService', function($http, UserTokenFactory){

    this.getAll = function(){
        return $http.get('/api/games',{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getById = function(id){
        return $http.get('/api/games/' + id,{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getLineup = function(id, user_id){
        return $http.get('/api/games/' + id + '/users/' + user_id + '/lineup',{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getLineupByGameAndTeam = function(id, team_id){
        return $http.get('/api/games/'+id+'/teams/'+team_id+'/lineup',{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.updateLineup = function(id, team_id, lineup){
        return $http.post('/api/games/'+id+'/teams/'+team_id+"/lineup",{lineup: JSON.stringify(lineup)}, {headers: {"x-access-token" : UserTokenFactory.getToken()}})
    }

    this.loadEventsByGameId = function(game_id){
        return $http.get('/api/games/' + game_id + '/events', {headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.loadGamesByUserId = function(user_id){
        return $http.get('/api/users/' + user_id +'/games', {headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getPositionsByEventId = function(event_id){
        return $http.get('/api/games/events/' + event_id + '/positions',{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getLatestGamePositionByGameId = function(game_id){
        return $http.get('/'+ game_id +'/positions/latest', {headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.startGameEvent = function(game_id){
        return $http.post('/api/games/' + game_id + '/start', {},{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getPlayableState = function(game_id){
        return $http.get("/api/games/" + game_id + "/approvals/state", {headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getLatestGameAction = function(game_id){
        return $http.get('api/games/'+game_id+'/events/latest', {headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.nextGameEvent = function(game_id,team1_player_id, team2_player_id){
        return $http.post('/api/games/' + game_id + '/events/next', {player1_id: team1_player_id, player2_id: team2_player_id},{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getTeamPlayersByUserId = function(game_id,user_id){
        return $http.get('/api/games/'+game_id+'/users/'+user_id+'/team',{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.getGamePositionByGameEvent = function(game_event_id){
        return $http.get('/api/games/events/' + game_event_id + '/positions', {headers: {"x-access-token" : UserTokenFactory.getToken()}})
    }

    this.create = function(team1_id, team2_id, field_id, league_id){
        return $http.post('/api/games', {team1_id: team1_id, team2_id: team2_id, field_id: field_id, league_id: league_id},{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }

    this.deleteById = function(id){
        return $http.delete('/api/games/'+id,{headers: {"x-access-token" : UserTokenFactory.getToken()}});
    }
});