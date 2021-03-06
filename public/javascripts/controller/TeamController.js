var TeamsController = App.controller('TeamsController', function($scope, UserTokenFactory, TeamService, PlayerService){

    $scope.selectedTeam;

    UserTokenFactory.getUserData().then(function(user){
        TeamService.getTeamByUserId(user.id).then(function(response){
            console.log("User Teams", response);
            $scope.teams = response.data.teams;
        });
    });

    $scope.loadTeams = function(user_id){
        TeamService.getTeamByUserId(user_id).then(function(response){
            console.log(response);
            $scope.teams = response.data.teams;
        });
    }

    $scope.updateTeam = function(team){
        TeamService.updateTeam(team.id, team.name).then(function(response){
            console.log(response);
        }).catch(function(err){
            console.log(err);
        })
    }

    $scope.deleteTeam = function(team){
        if(team && team.id){
            TeamService.deleteById(team.id).then(function(response){
                var index = $scope.teams.indexOf(team);
                $scope.teams.splice(index, 1);
            });
        }
    }

    $scope.createNewTeam = function(team_name, league_id){
        TeamService.create(team_name, league_id).then(function(response){
            console.log(response);
            $scope.teams.push(response.data.teams);
        }).catch(function(err){
            console.log(err);
        });
    }

    $scope.getPlayersByTeamId = function(team) {
        TeamService.getPlayers(team.id).then(function(response) {
            console.log(response.data.team);
            team.players = response.data.team;
            $scope.players = response.data.team;
            $scope.selectedTeam = team;
            console.log($scope.players);
        }).catch(function(err) {
            console.log(err);
        });
    }

    $scope.loadPlayerAttrs = function(player){
        console.log("loading players");
        if(player && player.id) {
            var attrs = PlayerService.getAttrByPlayerId(player.id).then(function (response) {
                console.log(response.data.attributes);
                player.attrs = response.data.attributes;
            });
        }
    }

    $scope.createPlayer = function(){
        PlayerService.create().then(function(response){
            console.log("Response", response);
            $scope.players.push(response.data);
        });
    }

    $scope.deletePlayer = function(player){
        PlayerService.deleteById(player.id).then(function(response){
            var index = $scope.players.indexOf(player);
            $scope.players.splice(index, 1);
        });
    }
});

