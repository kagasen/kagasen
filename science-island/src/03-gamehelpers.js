
function gameById(id){ for(var i=0;i<GAMES.length;i++){ if(GAMES[i].id===id) return GAMES[i]; } return null; }
function islandById(id){ for(var i=0;i<ISLANDS.length;i++){ if(ISLANDS[i].id===id) return ISLANDS[i]; } return null; }
function gamesOf(islandId){ return GAMES.filter(function(g){ return g.island===islandId; }); }
function playableOf(islandId){ return gamesOf(islandId).filter(function(g){ return !g.soon; }); }
