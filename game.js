const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const pseudo = urlParams.get('pseudo');
const gameRef = db.ref('games/' + code);

document.getElementById('gameCode').innerText = code;

let gameState = null;

// Écoute les changements de la partie
gameRef.on('value', snapshot => {
  if(!snapshot.exists()) return;
  gameState = snapshot.val();
  renderGame(gameState);
});

// Affichage du plateau
function renderGame(game){
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
    name.innerText = p;
    div.appendChild(name);

    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'playerCards';
    const cardCount = game.players[p].cards.length || 5;
    for(let i=0;i<cardCount;i++){
      const card = document.createElement('img');
      card.src = 'images/card.png';
      card.style.width = '40px';
      cardsDiv.appendChild(card);
    }
    div.appendChild(cardsDiv);

    playersCircle.appendChild(div);
  });

  renderPlayerHand();
}

// Affichage de la main du joueur
function renderPlayerHand(){
  const handDiv = document.getElementById('playerHand');
  handDiv.innerHTML = "";
  const hand = gameState.players[pseudo].cards;
  hand.forEach(cardName=>{
    const div = document.createElement('div');
    div.className = 'playerHandCard';
    div.innerText = cardName.includes(',') ? cardName.split(',')[1] : '';
    if(cardName.includes('Rouge')) div.style.backgroundColor = 'red';
    if(cardName.includes('Bleu')) div.style.backgroundColor = 'blue';
    if(cardName.includes('Jaune')) div.style.backgroundColor = 'yellow';
    if(cardName.includes('Vert')) div.style.backgroundColor = 'green';
    if(cardName.includes('MIX')) div.innerText = 'MIX';
    if(cardName.includes('Changement')) div.innerText = 'CC';
    if(cardName.includes('Reset')) div.innerText = 'RESET';

    div.onclick = ()=>playCard(cardName);
    handDiv.appendChild(div);
  });
}

// Jouer une carte (simplifié)
function playCard(card){
  if(gameState.currentTurn !== pseudo) return alert("Ce n'est pas ton tour !");
  const playerCards = gameState.players[pseudo].cards;
  const index = playerCards.indexOf(card);
  if(index===-1) return;

  // Déplacer la carte vers discard
  gameState.discard.push(card);
  playerCards.splice(index,1);

  // Tour suivant
  const keys = Object.keys(gameState.players);
  let nextIndex = (keys.indexOf(pseudo)+1) % keys.length;
  gameState.currentTurn = keys[nextIndex];

  gameState.players[pseudo].cards = playerCards;

  gameRef.set(gameState);
}
