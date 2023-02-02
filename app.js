const express = require("express");
const { open } = require("sqlite");
const app = express();
const path = require("path");
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");

//Initializing database and server

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

//API 1

const convertingDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT * FROM player_details
        ORDER BY player_id;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertingDBObjectToResponseObject(eachPlayer)
    )
  );
});

//API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  //console.log(playerId);
  const getPlayerByIDQuery = `
            SELECT * FROM player_details
            WHERE player_id=${playerId};
        `;
  const player = await db.get(getPlayerByIDQuery);
  //console.log(player);
  //console.log(convertingDBObjectToResponseObject(player));
  response.send(convertingDBObjectToResponseObject(player));
});

//API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerDetailsQuery = `
        UPDATE player_details
        SET 
        player_name='${playerName}'
        WHERE player_id=${playerId};
    `;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//API 4
const convertDBobjectToResponseObjAPI4 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
        SELECT * FROM  match_details
        WHERE match_id=${matchId};
    `;
  const match = await db.get(getMatchDetailsQuery);
  response.send(convertDBobjectToResponseObjAPI4(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  console.log(playerId);
  const getMatchDetailsForPlayerQuery = `
        SELECT * FROM player_match_score NATURAL JOIN match_details
        WHERE player_id=${playerId};
    `;
  const matchesByPlayer = await db.all(getMatchDetailsForPlayerQuery);
  console.log(matchesByPlayer);
  response.send(
    matchesByPlayer.map((eachMatch) =>
      convertDBobjectToResponseObjAPI4(eachMatch)
    )
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersInMatchQuery = `
        SELECT * FROM player_details NATURAL JOIN player_match_score
        WHERE match_id=${matchId};
    `;
  const playersInMatch = await db.all(getPlayersInMatchQuery);
  response.send(
    playersInMatch.map((eachPlayer) =>
      convertingDBObjectToResponseObject(eachPlayer)
    )
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(player_match_score.score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM player_details INNER JOIN player_match_score ON 
        player_match_score.player_id=player_details.player_id
        WHERE player_details.player_id=${playerId};

    `;
  const stats = await db.get(getStatsQuery);
  console.log(stats);
  response.send(stats);
});

module.exports = app;
