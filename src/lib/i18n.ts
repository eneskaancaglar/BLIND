import type { Rank, RevealResult, BlindMode } from "./types";

export type Language = "en" | "tr";

export type RoomSettings = {
  deckCount: 1 | 2;
  blindThreshold: 5 | 6 | 7;
  blindMode: BlindMode;
};

const STORAGE_KEY = "blind_language";

export const DEFAULT_LANGUAGE: Language = "en";

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  deckCount: 1,
  blindThreshold: 6,
  blindMode: "ORIGINAL_BLIND",
};

export type Vars = Record<string, string | number>;

const en = {
  cardGame: "Card Game",
  loading: "Loading...",
  or: "or",
  close: "Close",
  gotIt: "Got it",
  you: "You",
  host: "Host",
  blind: "BLIND",
  eliminated: "Out",
  cards: "cards",
  home: "Home",
  wait: "Please wait...",
  language: "Language",
  english: "English",
  turkish: "Turkish",
  soundOn: "Sound on",
  soundOff: "Sound off",

  homeSubtitle: "Create a room, share the code, play from your phone.",
  homeTagline: "Every bid is a risk. Every reveal is a challenge.",
  howToPlay: "How to Play?",
  invitedToRoom: "You're invited to room {code}",
  firebaseMissing: "No Firebase connection — check .env.local",
  firebaseReady: "Connection ready",
  playerName: "Player Name",
  playerNamePlaceholder: "Your name",
  createRoom: "Create Room",
  startRoom: "Start",
  roomCode: "Room Code",
  roomCodePlaceholder: "e.g. ABJ3K",
  joinRoom: "Join Room",
  joinRoomInvite: "Join Room {code}",
  errNameRequired: "Enter your player name first.",
  errCodeRequired: "Enter the room code.",
  errFirebase: "Firebase settings could not load.",
  errCreateRoom: "Could not create room.",
  errJoinRoom: "Could not join room.",

  deckCount: "Decks",
  deckSingle: "1 deck",
  deckDouble: "2 decks",
  blindThreshold: "BLIND at",
  blindThresholdCards: "{count} cards",
  blindGetsCards: "BLIND mode",
  blindModeOriginal: "Classic — no cards",
  blindModeHidden: "Hidden cards — can't see",
  blindNoCards: "BLIND — no cards",
  blindHiddenCards: "BLIND — cards hidden",
  blindGetsCardsYes: "Yes (can't see)",
  blindGetsCardsNo: "No",

  lobbyBlindCards: "BLIND cards: {value}",
  lobbyRoom: "Room",
  lobbyShare: "Share this code with other players",
  lobbyLink: "Link for phones",
  lobbyCopy: "Copy Link",
  lobbyCopied: "Copied!",
  lobbyCopyFail: "Could not copy. Send the link manually.",
  lobbyPlayers: "Players",
  lobbyPlayerCount: "{count} players",
  lobbyStart: "Start Game",
  lobbyStarting: "Starting...",
  lobbyWaitHost: "Waiting for host to start...",
  lobbyMinPlayers: "At least 2 players required.",
  lobbyNotFound: "Room not found.",
  lobbySettings: "Room settings",
  lobbyDeck: "{count} deck(s)",
  lobbyBlindAt: "BLIND at {count} cards",

  round: "Round",
  statusFinished: "Done",
  statusRevealed: "Open",
  statusBidding: "Bidding",
  currentBid: "Current bid",
  cardsRevealed: "Cards revealed",
  counting: "Counting...",
  turn: "Turn",
  yourHand: "Your hand",
  cantSeeCards: "You can't see your cards",
  playerNotFound: "Player not found",
  settingUp: "Setting up table...",

  revealCount: "Count",
  revealLoser: "Loser",
  revealWinner: "Wins round",
  revealNextRound: "Next Round",
  revealHostWait: "Host will continue...",
  revealOpenerWins: "Count ({actual}) ≥ bid ({bid}). Opener loses (+1 card).",
  revealBidderWins: "Count ({actual}) < bid ({bid}). Last bidder loses (+1 card).",
  revealBlindRevival:
    "{blind} returns with 5 cards! {opener} gets +1 penalty card.",
  roundResultTitle: "Round Over",
  roundTransitionTitle: "Next Round",
  roundTransitionSubtitle: "Round {round} — {name} starts",
  winner: "Winner: {name}",
  gameOver: "Game Over",
  youWon: "You won!",
  gameWonBy: "{name} won the game!",
  gameYouWonSubtitle: "Congratulations — you are the last player standing.",
  drawGame: "Draw",
  drawBlindRevival: "Both players cannot be BLIND — game ends in a draw.",
  backToHome: "Back to Home",
  revealAnyoneWait: "Waiting to continue...",
  leaveGameConfirm: "Are you sure you want to leave the game?",
  leaveGameYes: "Leave",
  leaveGameNo: "Stay",

  bidYourMove: "Your move",
  bidCount: "Count",
  bidRank: "Pick rank (no 2s)",
  bidLabel: "Bid: {count}× {rank}",
  bidHigher: "Choose a higher bid",
  bidPlace: "Place Bid",
  bidOpen: "Open!",
  bidFail: "Could not place bid.",
  bidOpenFail: "Could not open.",
  errContinue: "Could not continue.",

  chatTitle: "Reactions",
  chatToggle: "Open reactions",
  chatEmpty: "Pick an emoji below",

  rankJ: "Jack",
  rankQ: "Queen",
  rankK: "King",
  rankA: "Ace",

  rule1: "You see your own cards; opponents' cards are hidden (count is visible).",
  rule2: "On your turn: bid count + rank (e.g. 3 sixes). Rank order: 3 → Ace. 2s cannot be bid.",
  rule3: 'Say "Open" to reveal all cards. Count = bid rank + all 2s (wild).',
  rule4: "Count ≥ bid → opener loses. Count < bid → last bidder loses.",
  rule5: "Loser gets +1 card. At the blind limit they become BLIND and can never see their cards.",
  rule6: "BLIND who loses is out. Last player with cards wins.",
  rule7: "BLIND rule: BLIND bids. If the next player raises, play continues normally.",
  rule8: "If BLIND bids and the next player Opens: correct bid revives BLIND at threshold cards; opener gets +1 penalty. Wrong bid eliminates BLIND.",
  rule9: "BLIND mode: Classic = no cards while blind. Hidden cards = threshold cards dealt but blind player cannot see them.",
  rulesTitle: "How to Play?",
} as const;

const tr: Record<keyof typeof en, string> = {
  cardGame: "Kart Oyunu",
  loading: "Yükleniyor...",
  or: "veya",
  close: "Kapat",
  gotIt: "Anladım",
  you: "Sen",
  host: "Kurucu",
  blind: "BLIND",
  eliminated: "Elendi",
  cards: "kart",
  home: "Ana sayfa",
  wait: "Bekle...",
  language: "Dil",
  english: "English",
  turkish: "Türkçe",
  soundOn: "Ses açık",
  soundOff: "Ses kapalı",

  homeSubtitle: "Oda kur, kodu paylaş, telefondan oyna.",
  homeTagline: "Her iddia bir risk. Her Aç bir meydan okuma.",
  howToPlay: "Nasıl Oynanır?",
  invitedToRoom: "{code} odasına davet edildin",
  firebaseMissing: "Firebase bağlantısı yok — .env.local kontrol et",
  firebaseReady: "Bağlantı hazır",
  playerName: "Oyuncu Adı",
  playerNamePlaceholder: "Adınız",
  createRoom: "Oda Kur",
  startRoom: "Başlat",
  roomCode: "Oda Kodu",
  roomCodePlaceholder: "Örn: ABJ3K",
  joinRoom: "Odaya Katıl",
  joinRoomInvite: "{code} Odasına Katıl",
  errNameRequired: "Önce oyuncu adını yazman lazım.",
  errCodeRequired: "Oda kodunu yazman lazım.",
  errFirebase: "Firebase ayarları yüklenemedi.",
  errCreateRoom: "Oda kurulamadı.",
  errJoinRoom: "Odaya katılınamadı.",

  deckCount: "Deste",
  deckSingle: "1 deste",
  deckDouble: "2 deste",
  blindThreshold: "BLIND eşiği",
  blindThresholdCards: "{count} kart",
  blindGetsCards: "BLIND modu",
  blindModeOriginal: "Klasik — kartsız",
  blindModeHidden: "Gizli kart — göremez",
  blindNoCards: "BLIND — kart yok",
  blindHiddenCards: "BLIND — kartların gizli",
  blindGetsCardsYes: "Evet (görmez)",
  blindGetsCardsNo: "Hayır",

  lobbyBlindCards: "BLIND kart: {value}",

  lobbyRoom: "Oda",
  lobbyShare: "Bu kodu diğer oyuncularla paylaşın",
  lobbyLink: "Telefona gönderilecek link",
  lobbyCopy: "Linki Kopyala",
  lobbyCopied: "Kopyalandı!",
  lobbyCopyFail: "Link kopyalanamadı. Aşağıdaki adresi elle gönder.",
  lobbyPlayers: "Oyuncular",
  lobbyPlayerCount: "{count} kişi",
  lobbyStart: "Oyunu Başlat",
  lobbyStarting: "Başlatılıyor...",
  lobbyWaitHost: "Oda kurucusu oyunu başlatmayı bekliyor...",
  lobbyMinPlayers: "En az 2 oyuncu gerekli.",
  lobbyNotFound: "Oda bulunamadı.",
  lobbySettings: "Oda ayarları",
  lobbyDeck: "{count} deste",
  lobbyBlindAt: "BLIND: {count} kart",

  round: "El",
  statusFinished: "Bitti",
  statusRevealed: "Açık",
  statusBidding: "İddia",
  currentBid: "Güncel iddia",
  cardsRevealed: "Kartlar açıldı",
  counting: "Sayım yapılıyor",
  turn: "Sıra",
  yourHand: "Senin elin",
  cantSeeCards: "Kartlarını göremezsin",
  playerNotFound: "Oyuncu bulunamadı",
  settingUp: "Masa kuruluyor...",

  revealCount: "Sayım",
  revealLoser: "Kaybeden",
  revealWinner: "Kazanan",
  revealNextRound: "Sonraki El",
  revealHostWait: "Kurucu devam ettirecek...",
  revealOpenerWins:
    "Sayım ({actual}) ≥ iddia ({bid}). Aç diyen kaybetti (+1 kart).",
  revealBidderWins:
    "Sayım ({actual}) < iddia ({bid}). Son iddia eden kaybetti (+1 kart).",
  revealBlindRevival:
    "{blind} 5 kartla oyuna dönüyor! {opener} +1 kart cezası aldı.",
  roundResultTitle: "El Bitti",
  roundTransitionTitle: "Sonraki El",
  roundTransitionSubtitle: "El {round} — {name} başlıyor",
  winner: "Kazanan: {name}",
  gameOver: "Oyun Bitti",
  youWon: "Kazandın!",
  gameWonBy: "Oyunu {name} kazandı!",
  gameYouWonSubtitle: "Tebrikler — sona kalan oyuncu sensin.",
  drawGame: "Berabere",
  drawBlindRevival: "İki oyuncu da BLIND olamaz — oyun berabere biter.",
  backToHome: "Ana Menüye Dön",
  revealAnyoneWait: "Devam bekleniyor...",
  leaveGameConfirm: "Oyundan ayrılmak istediğine emin misin?",
  leaveGameYes: "Ayrıl",
  leaveGameNo: "Kal",

  bidYourMove: "Hamlen",
  bidCount: "Adet",
  bidRank: "Rütbe seç (2 yok)",
  bidLabel: "İddia: {count}× {rank}",
  bidHigher: "Daha yüksek iddia seç",
  bidPlace: "İddia Ver",
  bidOpen: "Aç!",
  bidFail: "İddia verilemedi.",
  bidOpenFail: "Açma başarısız.",
  errContinue: "Devam edilemedi.",

  chatTitle: "Tepkiler",
  chatToggle: "Tepkileri aç",
  chatEmpty: "Aşağıdan bir emoji seç",

  rankJ: "Vale",
  rankQ: "Kız",
  rankK: "Papaz",
  rankA: "As",

  rule1: "Her oyuncu kendi kartlarını görür; rakiplerin kartları kapalıdır (sayısı görünür).",
  rule2: "Sıra sende: adet + rütbe iddia et (ör. 3 tane 6). Rütbe sırası: 3 → As. 2 iddia edilemez.",
  rule3: "İstersen Aç de — tüm kartlar açılır. Sayım = iddia edilen rütbe + tüm 2'ler (joker).",
  rule4: "Sayım ≥ iddia → açan kaybeder. Sayım < iddia → son iddia eden kaybeder.",
  rule5: "Kaybeden +1 kart alır. BLIND eşiğinde BLIND olur ve kartlarını asla göremez.",
  rule6: "BLIND kaybederse elenir. Kartı kalan son oyuncu kazanır.",
  rule7: "BLIND kuralı: BLIND iddia eder. Sonraki yükseltirse oyun normal sürer.",
  rule8: "BLIND iddia verip sonraki Aç derse: iddia doğruysa BLIND eşik kadar kartla döner, açan +1 ceza alır. Yanlışsa BLIND elenir.",
  rule9: "BLIND modu: Klasik = kartsız BLIND. Gizli kart = eşik kadar kart verilir ama BLIND göremez.",
  rulesTitle: "Nasıl Oynanır?",
};

export const translations = { en, tr } as const;

export type TranslationKey = keyof typeof en;

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "tr" ? "tr" : "en";
}

export function setStoredLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
}

export function t(lang: Language, key: TranslationKey, vars?: Vars): string {
  const template = translations[lang][key] ?? translations.en[key];
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  );
}

export function rankLabel(lang: Language, rank: Rank): string {
  if (rank === "J") return t(lang, "rankJ");
  if (rank === "Q") return t(lang, "rankQ");
  if (rank === "K") return t(lang, "rankK");
  if (rank === "A") return t(lang, "rankA");
  return rank;
}

export function formatRevealSummary(
  lang: Language,
  result: RevealResult,
  bidCount: number
): string {
  const openerLoses = result.actualCount >= bidCount;
  const base = openerLoses
    ? t(lang, "revealOpenerWins", { actual: result.actualCount, bid: bidCount })
    : t(lang, "revealBidderWins", { actual: result.actualCount, bid: bidCount });

  if (result.blindRevivalName) {
    return `${base} ${t(lang, "revealBlindRevival", {
      blind: result.blindRevivalName,
      opener: result.openerName,
    })}`;
  }
  return base;
}

export function getRuleKeys(): TranslationKey[] {
  return ["rule1", "rule2", "rule3", "rule4", "rule5", "rule6", "rule7", "rule8", "rule9"];
}
