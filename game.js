const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const pseudo = urlParams.get('pseudo');
const gameRef = db.ref('games/' + code);

document.getElementById('gameCode').innerText = code;

let gameState = null;
let timerInterval = null;
let timerProgress = 100;

// Écoute les changements de la partie
gameRef.on('value', snapshot => {
  if(!snapshot.exists()) return;
  gameState = snapshot.val();
  renderGame(gameState);
  if(gameState.status === 'started' && gameState.currentTurn === pseudo){
    startTimer();
  } else stopTimer();
});

// AFFICHAGE DU PLATEAU
function renderGame(game){
  renderPlayers(game);
  renderPlayerHand();
  updateDiscard();
  checkWinner(game);
}

function renderPlayers(game){
  const playersCircle = document.getElementById('playersCircle');
  playersCircle.innerHTML = "";
  const playerKeys = Object.keys(game.players);
  const centerX = window.innerWidth/2;
  const centerY = window.innerHeight/2;
  const radius = 200;

  playerKeys.forEach((p,index)=>{
    const angle = (index/playerKeys.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle) - 50;
    const y = centerY + radius * Math.sin(angle) - 50;

    const div = document.createElement('div');
    div.className = 'player';
    div.style.left = x + 'px';
    div.style.top = y + 'px';

    const name = document.createElement('div');
    name.innerText = p + (game.currentTurn===p ? " ⏳" : "");
    div.appendChild(name);

    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'playerCards';
    const cardCount = game.players[p].cards.length;
    for(let i=0;i<cardCount;i++){
      const card = document.createElement('img');
      card.src = 'images/card.png';
      card.style.width = '40px';
      cardsDiv.appendChild(card);
    }
    div.appendChild(cardsDiv);
    playersCircle.appendChild(div);
  });
}

// AFFICHAGE DE LA MAIN DU JOUEUR
function renderPlayerHand(){
  const handDiv = document.getElementById('playerHand');
  handDiv.innerHTML = "";
  const hand = gameState.players[pseudo].cards;
  hand.forEach(cardName=>{
    const div = document.createElement('div');
    div.className = 'playerHandCard';
    div.innerText = '';
    if(cardName.includes(',') && !cardName.includes('MIX')){
      div.innerText = cardName.split(',')[1];
    }
    if(cardName.includes('Rouge')) div.style.backgroundColor = 'red';
    if(cardName.includes('Bleu')) div.style.backgroundColor = 'blue';
    if(cardName.includes('Jaune')) div.style.backgroundColor = 'yellow';
    if(cardName.includes('Vert')) div.style.backgroundColor = 'green';
    if(cardName.includes('MIX')) div.innerText = 'MIX';
    if(cardName.includes('Changement')) div.innerText = 'CC';
    if(cardName.includes('Reset')) div.innerText = 'RESET';

    div.onclick = ()=>playCard(cardName, div);
    handDiv.appendChild(div);
  });
}

// AFFICHAGE DE LA DEFAUSSE
function updateDiscard(){
  const actual = document.getElementById('actual');
  if(gameState.discard.length>0){
    const lastCard = gameState.discard[gameState.discard.length-1];
    actual.src = getCardImage(lastCard);
  }
}

// OBTENIR IMAGE POUR CARTE
function getCardImage(card){
  if(card.includes('Rouge')) return 'images/red.png';
  if(card.includes('Bleu')) return 'images/blue.png';
  if(card.includes('Jaune')) return 'images/yellow.png';
  if(card.includes('Vert')) return 'images/green.png';
  if(card.includes('MIX')) return 'images/mix.png';
  if(card.includes('Changement')) return 'images/colorswitch.png';
  if(card.includes('Reset')) return 'images/reset.png';
  return 'images/card.png';
}

// TIMER
function startTimer(){
  stopTimer();
  timerProgress = 100;
  timerInterval = setInterval(()=>{
    timerProgress -= 1.5;
    if(timerProgress<=0){
      clearInterval(timerInterval);
      nextTurn();
    }
    document.getElementById('timerBar').style.width = timerProgress + "%";
  }, 300);
}

function stopTimer(){
  clearInterval(timerInterval);
  document.getElementById('timerBar').style.width = '100%';
}

// JOUE UNE CARTE
function playCard(card, div){
  if(gameState.currentTurn !== pseudo) return;
  if(!canPlayCard(card)) return alert("Carte non jouable !");
  
  // Animation
  div.classList.add('playing');
  const actualPos = document.getElementById('actual').getBoundingClientRect();
  div.style.position='absolute';
  div.style.left = actualPos.left + 'px';
  div.style.top = actualPos.top + 'px';
  
  setTimeout(()=>{
    div.remove();
    processCardEffect(card);
  }, 500);
}

// Vérifie si la carte peut être jouée
function canPlayCard(card){
  const last = gameState.discard[gameState.discard.length-1];
  if(!last) return true;
  if(card.includes('Changement') || card.includes('Reset') || card.includes('MIX')) return true;
  const color1 = last.split(',')[0];
  const value1 = last.split(',')[1];
  if(card.includes(color1)) return true;
  if(card.includes(value1)) return true;
  return false;
}

// EFFECTS SPECIAUX
function processCardEffect(card){
  let hand = gameState.players[pseudo].cards;
  const idx = hand.indexOf(card);
  hand.splice(idx,1);
  gameState.players[pseudo].cards = hand;
  gameState.discard.push(card);

  // MIX -> échanger cartes
  if(card.includes('MIX')){
    const keys = Object.keys(gameState.players).filter(k=>k!==pseudo);
    if(keys.length>0){
      const target = keys[Math.floor(Math.random()*keys.length)];
      const temp = gameState.players[target].cards;
      gameState.players[target].cards = hand;
      gameState.players[pseudo].cards = temp;
    }
  }

  // Changement de couleur -> demander couleur
  if(card.includes('Changement')){
    const color = prompt("Choisis une couleur : Rouge, Bleu, Jaune, Vert");
    if(['Rouge','Bleu','Jaune','Vert'].includes(color)){
      gameState.discard[gameState.discard.length-1] = color + ",CC";
    }
  }

  // Reset -> pioche toutes cartes d'un joueur
  if(card.includes('Reset')){
    const keys = Object.keys(gameState.players).filter(k=>k!==pseudo);
    if(keys.length>0){
      const target = keys[Math.floor(Math.random()*keys.length)];
      gameState.players[pseudo].cards.push(...gameState.players[target].cards);
      gameState.players[target].cards = [];
    }
  }

  nextTurn();
  gameRef.set(gameState);
}

// PASSER AU TOUR SUIVANT
function nextTurn(){
  const keys = Object.keys(gameState.players);
  let idx = keys.indexOf(gameState.currentTurn);
  idx = (idx+1) % keys.length;
  gameState.currentTurn = keys[idx];
  gameRef.set(gameState);
}

// VÉRIFIE VAINQUEUR
function checkWinner(game){
  const winner = Object.keys(game.players).find(p=>game.players[p].cards.length===0);
  if(winner){
    alert("🎉 " + winner + " a gagné !");
    gameRef.child('status').set('waiting');
  }
}
