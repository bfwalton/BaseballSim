var bluebird = require('bluebird');
var Promise = bluebird.Promise;
var DatabaseController = require('./DatabaseController');

var PlayerController = require('./PlayersController');
var ApprovalsController = require('./ApprovalsController');
var PermissionController = require('./PermissionController');
var TeamsController = require('./TeamsController');

var LineupController = require('./LineupController');

// Don't yell at me Brandon I wanted some global variables
var numBalls = 0;
var numStrikes = 0;
exports.getGames = function(limit, offset){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * from games LIMIT $1 OFFSET $2", [limit | 1000, offset | 0]).then(function(data){
            resolve(data.rows);
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.getGameByUserId = function(user_id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * from games WHERE id in (SELECT item_id FROM permissions WHERE item_type='games' AND user_id=$1)", [user_id]).then(function(data){
            resolve(data.rows);
        }).catch(function(err){
            reject(err);
        });

    });
}



exports.createGame = function(team1_id, team2_id, field_id, league_id){
    return new Promise(function(resolve, reject){
        if(team1_id && team2_id){
            DatabaseController.query("INSERT INTO games (team1_id, team2_id, field_id, league_id) VALUES ($1, $2, $3, $4) RETURNING *", [team1_id, team2_id, field_id | 0, league_id | 0]).then(function(data){
                PermissionController.getOwnerForItem('teams', team1_id).then(function(response){
                    var user1_id = response.rows[0].user_id;

                    PermissionController.getOwnerForItem('teams', team2_id).then(function(response2){
                        var user2_id = response2.rows[0].user_id;
                        ApprovalsController.createApproval('games', data.rows[0].id, user2_id).then(function(approval){
                            PermissionController.addPermission('games', data.rows[0].id, user1_id).then(function(user1_perm){
                                PermissionController.addPermission('games', data.rows[0].id, user2_id).then(function(user1_perm){
                                    resolve(data.rows[0]);
                                });
                            });

                        }).catch(function(err){
                            reject(err);
                        });

                    }).catch(function(err){
                        reject(err);
                    });

                }).catch(function(err){
                    reject(err);
                });
            }).catch(function(err){
                reject(err);
            });
        }else {
            reject("Must have 2 teams in a game!");
        }
    });
}

exports.getEventsByGameId = function(game_id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * FROM game_action WHERE game_id = $1", [game_id]).then(function(data){
            resolve(data.rows);
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.isGameStarted = function(game_id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * FROM game_action WHERE game_id = $1 AND type = 'start'", [game_id]).then(function(data){
            if(data.rows.length > 0){
                resolve({started: true, game_action: data.rows});
            }else{
                resolve({started: false});
            }
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.getPlayerPositionByGameEventId = function(game_event_id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * from game_player_positions WHERE game_action_id = $1", [game_event_id]).then(function(result){
            resolve(result.rows[0]);
        }).catch(function(err){
            reject(err);
        });
    });
}


function addPlayerPosition(game_action_id, firstbase_player_id, secondbase_player_id, thirdbase_player_id){
    return DatabaseController.query("INSERT INTO game_player_positions (game_action_id, onfirst_id, onsecond_id, onthird_id) VALUES ($1, $2, $3, $4)", [game_action_id, firstbase_player_id, secondbase_player_id, thirdbase_player_id]);
}

function createApprovalsForEvent(game_id, event_id){
   return new Promise(function(resolve, reject){
       var promises = [];
       PermissionController.getOwnerForItem('games', game_id).then(function(data){
           var users = data.rows;
           for(var i = 0;i<data.rows.length;i++){
               promises.push(ApprovalsController.createApproval('events', event_id, users[i].user_id));
           }
           Promise.all(promises).then(function(data){
                console.log(data);
                resolve(data);
           }).catch(function(err){
                console.log(err);
           });
       }).catch(function(err){
           console.log(err);
       });
   });
}

//Unused?
//exports.checkNextTurnReadyState = function(game_id){
//    return new Promise(function(resolve,reject){
//        exports.getEventsByGameId(game_id).then(function(data){
//
//        }).catch(function(err){
//
//        });
//    });
//}

exports.getLatestEventForGame = function(game_id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * FROM game_action WHERE game_id=$1 ORDER BY date_created DESC LIMIT 1;", [game_id]).then(function(data){
            resolve(data.rows[0]);
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.getLatestEventApprovalsForGame = function(game_id){
    return new Promise(function(resolve, reject){
        exports.getLatestEventForGame(game_id).then(function(data){
            ApprovalsController.getApprovalByItemTypeAndId('events', data.id).then(function(approvals){
                resolve(approvals);
            }).catch(function(err){
              reject(err);
            })
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.getLatestGameActionByGameId = function(game_id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * FROM game_action WHERE game_id = $1 ORDER BY date_created DESC LIMIT 1", [game_id]).then(function(result){
            resolve(result.rows[0]);
        }).catch(function(err){
            reject(err);
        });
    });
}


//TODO: Break The Start Game Method Down to Reduce complexity
exports.startGame = function(game_id){
    return new Promise(function(resolve, reject){
        if(game_id){
            ApprovalsController.getApprovalByItemTypeAndId('games', game_id).then(function(data){
                if(checkAllForApprovalStatus(data) === true){
                    exports.isGameStarted(game_id).then(function(data){
                        if(data.started == false){
                            DatabaseController.query("INSERT INTO game_action (game_id, team1_score, team2_score, type, message) VALUES ($1, 0, 0, 'start', 'Game Started!') RETURNING *", [game_id]).then(function(data){
                                exports.getGameById(game_id).then(function(game){
                                    Promise.all(LineupController.setDefaultLineup(game[0].team1_id, data.rows[0].id), LineupController.setDefaultLineup(game[0].team2_id, data.rows[0].id)).then(function(result){
                                        var game_event = data.rows[0];
                                        addPlayerPosition(game_event.id, 0, 0, 0).then(function(data){
                                            createApprovalsForEvent(game_id, game_event.id).then(function(approvals){
                                                resolve(game_event);
                                            }).catch(function(err){
                                                reject(err);
                                            });
                                        }).catch(function(err){
                                            reject(err);
                                        });
                                    }).catch(function(err){
                                        reject(err);
                                    });
                                }).catch(function(err){
                                   reject(err);
                                });
                            }).catch(function(err){
                                reject(err);
                            });
                        }else{
                            reject("Game \'" + game_id + "\' is already started");
                        }
                    }).catch(function(err){
                        reject(err);
                    });
                }else{
                    reject("All Players Must Accept Before Play Can Start");
                }
            }).catch(function(err){
                reject(err);
            });
        }else{
            reject("Game ID is Required");
        }
    });
}

exports.getActionsByGameId = function(game_id, limit, offset){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * from game_actions WHERE game_id=$3 LIMIT $1 OFFSET $2", [limit | 1000, offset | 0, game_id]).then(function(data){
            resolve(data.rows);
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.deleteGamesById = function(id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("DELETE FROM games WHERE id = $1 RETURNING *;", [id]).then(function(data){
            resolve({game: data.rows});
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.getGameById = function(id){
    return new Promise(function(resolve, reject){
        DatabaseController.query("SELECT * from games WHERE id = $1", [id]).then(function(data){
            resolve(data.rows);
        });
    });
}

exports.doGameEvent = function(game_id, player1_id, player2_id){
    return new Promise(function(resolve, reject){
        basicPlayerEvent(player1_id, player2_id).then(function(result){
        //gameAlgorithmController(game_id, player1_id, player2_id).then(function(result) {
            var game_message = generateMessage(player1_id, player2_id, game_id, result);
            DatabaseController.query("INSERT INTO game_action (game_id, team1_score, team2_score, type, message) VALUES ($1, 0, 0, $2, $3) RETURNING *", [game_id, result, game_message]).then(function(data){
                Promise.all([LineupController.sendPlayerToBackofLineup(player1_id), LineupController.sendPlayerToBackofLineup(player2_id)]).then(function(result){
                    resolve(data.rows);
                }).catch(function(err){
                    reject(err);
                });
            }).catch(function(err){
                reject(err);
            });
        }).catch(function(err){
            reject(err);
        });
    });
}

function generateMessage(player1_id, player2_id, game_id, result){
    return "Player " + player1_id + " got a " + result + " against " + player2_id;
}

//'home_run', 'walk', 'triple', 'double', 'single', 'ball', 'strike', 'foul'
function calculateNewPlayerPositions(obj_prev_pos, event){
    var player_pos = {onfirst_id: 0, onsecond_id: 0, onthird_id: 0};

    if(event == 'home_run'){
        return player_pos;
    }else{

    }
}


/*
 * Different method of doing the basicPlayerEvent, uses game_id instead of only players
 * Not working
 */
function gameAlgorithmController(game_id, player1_id, player2_id) {
    return new Promise(function(resolve, reject) {
        var team2 = game_id.team1_id;
        var team1 = game_id.team2_id;

        var player1 = player1_id;
        var player2 = player2_id;

        basicPlayerEvent(player1, player2);
    }).catch(function(err){
        reject(err);
    });
}

/**
 * Should Return any of 'home_run', 'walk', 'triple', 'double', 'single', 'ball', 'strike', 'foul' (Not 'strike_out' or 'walk')
 * @param player1_id (Batter)
 * @param player2_id (Pitcher)
 * @returns {Promise}
 * Calculates outcome based on player attributes
 */
function basicPlayerEvent(player1_id, player2_id){
    return new Promise(function(resolve, reject){
        PlayerController.getPlayersById(player1_id).then(function(player1){
            PlayerController.getPlayersById(player2_id).then(function(player2){
                //console.log("TEST");
                var totalattrs;
                var max = 100 + totalattrs;
                var min = 0;

                // Base chance for each outcome

                var ball = 25;
                var single = 10;
                var double = 5;
                var triple = 3;
                var home_run = 2;

                var strike = 25;
                var out = 20;
                var foul = 20;

                Promise.all([PlayerController.getPlayerAttributesById(player1_id),PlayerController.getPlayerAttributesById(player2_id)]).spread(function(player1, player2){
                    //console.log("TEST2");
                    //console.log(player1);

                    var outcome = ' ';
                    var options = ['ball', 'single', 'double', 'triple', 'home_run', 'strike', 'out', 'foul', 'strike_out', 'walk'];

                    // Attributes
                    var technique = player2.technique;
                    var pitch_speed = player2.pitch_speed;
                    var endurance = player2.endurance;

                    var contact = player1.contact;
                    var swing_speed = player1.swing_speed;
                    var bat_power = player1.bat_power;

                    // Stats
                    var hits = 0;
                    var hits_allowed = 0;
                    var at_bats = 0;
                    var innings_pitched = 0;
                    var doubles = 0;
                    var triples = 0;
                    var homeruns = 0;

                    totalattrs = contact + swing_speed + bat_power + technique + pitch_speed
                        + endurance;

                    ball += ((.7 * swing_speed));
                    single += ((.15 * swing_speed) + (.6 * contact));
                    double += ((.3 * bat_power) + (.15 * swing_speed) + (.4 * contact));
                    home_run += (.4 * bat_power);

                    strike += ((.4 * endurance) + (technique));
                    out += ((.3 * endurance) + (.5 * pitch_speed));
                    foul += ((.5 * pitch_speed) + (.3 * endurance));

                    // Selection of RNG
                    var rng = 0;
                    var num = Math.floor(Math.random() * 100+totalattrs);
                    console.log('Choosing Outcome: ' + num);
                    if (num >= 0  && num < ball){
                        // Returns Ball
                        rng = 0;
                        console.log('Passing in "ball"');
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    else if (num >= ball && num < ball+single){
                        // Returns Single
                        rng = 1;
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    else if (num >= ball+single && num < (ball+single+double)) {
                        // Returns Double
                        rng = 2;
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    else if (num >= (ball+single+double) && num < (ball+single+double+triple)) {
                        // Returns Triple
                        rng = 3;
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    else if (num >= (ball+single+double+triple) && num < (ball+single+double+triple+home_run)) {
                        // Returns Home Run
                        rng = 4;
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    else if (num >= (ball+single+double+triple+home_run) && num < (ball+single+double+triple+home_run+strike)) {
                        // Returns Strike
                        rng = 5;
                        console.log('Strike');
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    else if (num >= (ball+single+double+triple+home_run+strike) && num < (ball+single+double+triple+home_run+strike+out)) {
                        // Returns Out
                        rng = 6;
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    else if (num >= (ball+single+double+triple+home_run+strike+out) && num < (totalattrs+100)){
                        // Returns Foul
                        rng = 7;
                        console.log('Foul');
                        outcome = exports.ballsAndStrikesCounter(options[rng]);
                    }
                    console.log(totalattrs);


                    //console.log("RAND: " + outcome);

                    // Tracks stats based on outcome
                    PlayerController.statTracker(player1, player2, options[rng]);


                    resolve(outcome);
                });
            }).catch(function(err){
                reject(err);
            });
        }).catch(function(err){
            reject(err);
        });
    });
}

function checkAllForApprovalStatus(approvals){
    console.log("Approvals", approvals);
    var approvals = approvals.filter(function(item){
        return item.approved != 'approved';
    });
    return approvals.length == 0;
}

/*
 * params - outcome of basicPlayerEvent
 * returns - specific outcome after totaling balls & strikes
 * adds strike_out and walk outcome possibilities
 */
exports.ballsAndStrikesCounter = function(outcome) {
    console.log('Outcome: ' + outcome);
    if (outcome == 'ball' && numBalls != 3) {
        numBalls += 1;

    }
    else if (outcome == 'strike' && numStrikes != 2) {
        numStrikes += 1;
    }
    else if (outcome == 'out') {
        numStrikes = 0;
        numBalls = 0;
    }
    else if (outcome == 'foul') {
        if (numStrikes == 2) {
            numStrikes = 2;
        }
        else {
            numStrikes += 1;
        }
    }
    else if (outcome == 'ball' && numBalls == 3) {
        outcome = 'walk';
        numBalls = 0;
        numStrikes = 0;
    }
    else if (outcome == 'strike' && numStrikes == 2) {
        outcome = 'strike_out';
        numBalls = 0;
        numStrikes = 0;
    }
    else {
        numBalls = 0;
        numStrikes = 0;
        return outcome;
    }
    console.log('Count: ' + numBalls + ' balls, ' + numStrikes + ' strikes.');
    //DatabaseController.query("INSERT INTO game_action
    console.log('Outcome Final: ' + outcome);
    return outcome;
}
/*
exports.getStrikesAndBalls = function(outcome) {
    DatabaseController.query()
}
*/

/**
 * Things to keep track of during the game:
 * - Inning
 * - Out(s)
 * - # of Balls
 * - # of Strikes
 * - Runners on base
 * - Score
 * - Stats
 * - # of Hits (per team)
 * - # of Errors (per team) *for later*
 */
