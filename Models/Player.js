var bluebird = require('bluebird');
var Promise = bluebird.Promise;

var DatabaseController = require("./../Controller/DatabaseController");

module.exports =  {
    create : function(firstname, lastname, position, team_id){
        return new Promise(function(resolve, reject){
            DatabaseController.query("INSERT INTO players (firstname,lastname,position,team_id) VALUES($1, $2, $3, $4) RETURNING *", [firstname, lastname, position, team_id]).then(function(result){
                resolve(result.rows[0]);
            }).catch(function(err){
                reject(err);
            });
        });
    },
    update : function(id, obj) {
        return new Promise(function (resolve, reject) {
            DatabaseController.update('players', id, obj).then(function (result) {
                resolve(result.rows[0]);
            }).catch(function (err) {
                reject(err);
            });
        });
    },
    getAll : function(limit, offset){
        return new Promise(function(resolve, reject){
            DatabaseController.query("SELECT * from players LIMIT $1 OFFSET $2", [limit || 1000, offset || 0]).then(function(result){
                resolve(result.rows);
            }).catch(function(err){
                reject(err);
            });
        });
    },
    getById : function(id){
        return new Promise(function(resolve, reject){
            DatabaseController.query("SELECT * from players WHERE id = $1", [id]).then(function(result){
                resolve(result.rows[0]);
            }).catch(function(err){
                reject(err);
            });
        });
    },
    getByTeamId : function(team_id){
        return new Promise(function(resolve, reject){
            DatabaseController.query("SELECT * from players WHERE team_id = $1", [team_id]).then(function(result){
                resolve(result.rows);
            }).catch(function(err){
                reject(err);
            });
        });
    },
    updateAttributesById : function(id, obj){
        return new Promise(function(resolve, reject){
            var keys = Object.keys(obj);
            var sql = "UPDATE attributes SET ";
            var values = [];
            for(var i = 0;i<keys.length;i++){
                sql += keys[i] + "=$"+(i+1);
                values.push(obj[keys[i]]);
                if(i != keys.length-1){
                    sql += ",";
                }
            }

            sql += " WHERE player_id="+id+" RETURNING *";

            DatabaseController.query(sql, values).then(function(result){
                resolve(result.rows[0]);
            }).catch(function(err){
               reject(err);
            });
        });
    },
    getAttributesById : function(id){
        return new Promise(function(resolve, reject){
            DatabaseController.query("SELECT * FROM attributes WHERE player_id = $1", [id]).then(function(result){
                resolve(result.rows[0]);
            }).catch(function(err){
                reject("" + err);
            });
        });
    },
    deleteByTeamId : function(team_id){
        return new Promise(function(resolve, reject){
            DatabaseController.query("DELETE FROM players WHERE team_id = $1 RETURNING *;", [team_id]).then(function(result){
                resolve(result.rows);
            }).catch(function(err){
                reject(err);
            });
        });
    },
    deleteById : function(id){
        return new Promise(function(resolve, reject){
            DatabaseController.query("DELETE FROM players WHERE id = $1 RETURNING *;", [id]).then(function(result){
                resolve(result.rows[0]);
            }).catch(function(err){
                reject(err);
            });
        });
    }
}