var Promise = require('bluebird').Promise;
//var DatabaseController = require('./DatabaseController');
var PlayerController = require('./PlayersController');

var TeamModel = require('./../Models/Team');
var PlayerModel = require('./../Models/Player');

const TEAM_SIZE = 25;


//exports.getTeams = function() {
//	return new Promise(function(resolve, reject){
//		DatabaseController.query("SELECT * from teams").then(function(data){
//			resolve(data.rows);
//		});
//	});
//}
//
//exports.createTeam = function(team_name, league_id){
//	return DatabaseController.query("INSERT INTO teams (name,league_id) VALUES($1, $2)", [team_name, league_id]);
//}

exports.buildRandomTeam = function(team_name, league_id){
	return new Promise(function(resolve, reject){
		TeamModel.create(team_name, league_id).then(function(team){
			var players = [];
			for(var i = 0;i<TEAM_SIZE;i++){
				players.push(PlayerController.createRandomPlayer(team.id));
			}
			Promise.all(players).then(function(data){
				var object = team;
				object.players = data;
				resolve(object);
			}).catch(function(err){
				reject(err);
			});
		}).catch(function(err){
			reject(err);
		});
	});
}

//exports.updateTeam = function(id, teamname){
//	return new Promise(function(resolve, reject){
//		DatabaseController.query("UPDATE teams SET name=$2 WHERE id=$1 RETURNING *", [id, teamname]).then(function(data){
//			resolve(data.rows[0]);
//		}).catch(function(err){
//			reject(err);
//		})
//	});
//}

//exports.getTeamByUserId = function(user_id){
//	return new Promise(function(resolve, reject){
//		DatabaseController.query("SELECT * from teams WHERE id in (SELECT item_id FROM permissions WHERE item_type='teams' AND user_id=$1)", [user_id]).then(function(data){
//			resolve(data.rows);
//		}).catch(function(err){
//			reject(err);
//		});
//	});
//}

exports.deleteTeamById = function(id) {
	return new Promise(function(resolve, reject){
		TeamModel.deleteById(id).then(function(team) {
			PlayerModel.deleteByTeamId(id).then(function(players) {
				resolve(team);
			}).catch(function(err){
				reject(err);
			});
		}).catch(function (err) {
			reject(err);
		});
	});
}

//exports.getPlayersByTeamId = function(team_id){
//	return new Promise(function(resolve, reject){
//		DatabaseController.query("SELECT * FROM players WHERE team_id = $1", [team_id]).then(function(response){
//			resolve(response.rows);
//		});
//	});
//}

//exports.getTeamById = function(id){
//	return new Promise(function(resolve, reject){
//		DatabaseController.query("SELECT * from teams WHERE id = $1", [id]).then(function(data){
//			resolve(data.rows[0]);
//		});
//	});
//}
