// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDyWu4TI4PIRXfeb7yqt0WIGClgu10IjkM",
  authDomain: "kylita-f2923.firebaseapp.com",
  databaseURL: "https://kylita-f2923-default-rtdb.firebaseio.com",
  projectId: "kylita-f2923",
  storageBucket: "kylita-f2923.firebasestorage.app",
  messagingSenderId: "431823530994",
  appId: "1:431823530994:web:88a07e633751686e5ad96b",
  measurementId: "G-F4LLNWQJ16"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Génération code unique
function generateGameCode() {
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

// HOST une partie
function hostGame() {
  const pseudo = document.getElementById('pseudo').value.trim();
  if(!pseudo) { alert("Entre un pseudo"); return; }
  const code = generateGameCode();
  const gameRef = db.ref('games/' + code);

  const colors = ["Rouge","Bleu","Jaune","Vert"];
  const deck = [];
  colors.forEach(c => { for(let i=1;i<=4;i++) deck.push(c+','+i); });
  deck.push("Rouge,MIX","Bleu,MIX","Jaune,MIX","Vert,MIX","Changement de couleur","Reset");

  const shuffledDeck = deck.sort(() => 0.5 - Math.random());

  gameRef.set({
    host: pseudo,
    status: 'waiting',
    players: {
      [pseudo]: { cards: shuffledDeck.slice(0,5), connected:true, turn:false }
    },
    deck: shuffledDeck.slice(5),
    discard: [],
    currentTurn: pseudo
  });

  window.location.href = "game.html?code=" + code + "&pseudo=" + pseudo;
}

// Rejoindre une partie
function joinGame() {
  const pseudo = document.getElementById('pseudo').value.trim();
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  if(!pseudo || !code) { alert("Pseudo et code requis"); return; }
  const gameRef = db.ref('games/' + code);

  gameRef.get().then(snapshot => {
    if(snapshot.exists()){
      const game = snapshot.val();
      game.players[pseudo] = { cards: [], connected:true, turn:false };
      gameRef.child('players').set(game.players);
      window.location.href = "game.html?code=" + code + "&pseudo=" + pseudo;
    } else alert("Partie introuvable !");
  });
}
