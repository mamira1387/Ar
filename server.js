// ============================================
// 🎮 Telegram Game Bot - Server
// Professional Betting Games Platform
// ============================================

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURATION
// ============================================

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Environment Variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8287086829:AAF-EQHumXGP9edcLOLBPzWwNM3q48OJ_Qg';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '5967073165';
const PORT = process.env.PORT || 3000;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://yourdomain.com/mini-app';

// Database (In-Memory for now, replace with MongoDB)
const users = new Map();
const games = new Map();
const arenas = new Map();
const pvpMatches = new Map();
const settings = {
  TAX_PERCENT: 1,
  MIN_WITHDRAW: 10000,
  SLOTS_PRICE: 1000,
  CRASH_PRICE: 1000,
  BOMB_PRICE: 1000,
  ARENA_PRICE: 1000,
  PVP_PRICE: 1000
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'بیش از حد درخواست داده‌اید، لطفاً بعداً تلاش کنید'
});

app.use('/api/', limiter);

// ============================================
// TELEGRAM BOT SETUP
// ============================================

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'کاربر';

  // Initialize user
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      telegramId: userId,
      firstName,
      balance: 0,
      coins: 100000,
      stars: 0,
      ton: 0,
      nfts: [],
      gamesPlayed: 0,
      totalWon: 0,
      totalLost: 0,
      createdAt: new Date(),
      lastActive: new Date()
    });
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎮 بازی‌های من', web_app: { url: MINI_APP_URL + '?tab=games' } },
        { text: '💰 کیف پول', web_app: { url: MINI_APP_URL + '?tab=wallet' } }
      ],
      [
        { text: '🎰 اسلات', callback_data: 'game_slots' },
        { text: '💥 کرش', callback_data: 'game_crash' },
        { text: '💣 بمب', callback_data: 'game_bomb' }
      ],
      [
        { text: '🏟️ آرنا', callback_data: 'game_arena' },
        { text: '⚔️ PVP', callback_data: 'game_pvp' }
      ],
      [{ text: '📊 داشبورد ادمین', callback_data: 'admin_panel' }],
      [{ text: '❓ راهنما', callback_data: 'help' }]
    ]
  };

  bot.sendMessage(
    chatId,
    `سلام ${firstName}! 👋\n\nبه بات بازی‌های تلگرام خوش آمدید! 🎮\n\nچه بازی‌ای را دوست دارید؟`,
    { reply_markup: keyboard }
  );
});

// ============================================
// ROUTES - API
// ============================================

// ========== USER ROUTES ==========
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.get(parseInt(userId));

  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  res.json(user);
});

app.post('/api/user/:userId/balance', (req, res) => {
  const { userId } = req.params;
  const user = users.get(parseInt(userId));

  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  res.json({
    coins: user.coins,
    stars: user.stars,
    ton: user.ton,
    totalBalance: user.coins + user.stars * 100 + user.ton * 1000
  });
});

// ========== SLOTS GAME ==========
app.post('/api/games/slots/play', (req, res) => {
  const { userId, bet, currency } = req.body;
  const user = users.get(parseInt(userId));

  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const betAmount = parseInt(bet);
  if (user.coins < betAmount) {
    return res.status(400).json({ error: 'سکه کافی ندارید' });
  }

  // Deduct bet
  user.coins -= betAmount;

  // Generate slots result
  const symbols = ['🍎', '🍌', '🍒', '🍓', '⭐', '💎'];
  const result = [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  let multiplier = 0;
  if (result[0] === result[1] && result[1] === result[2]) {
    multiplier = 100; // Jackpot
  } else if (result[0] === result[1] || result[1] === result[2]) {
    multiplier = 5; // Win
  }

  const winAmount = betAmount * multiplier;
  user.coins += winAmount;
  user.gamesPlayed += 1;

  if (multiplier > 0) {
    user.totalWon += winAmount;
  } else {
    user.totalLost += betAmount;
  }

  // Tax
  const tax = Math.floor(betAmount * (settings.TAX_PERCENT / 100));
  user.coins -= tax;

  const gameId = uuidv4();
  games.set(gameId, {
    id: gameId,
    userId,
    type: 'slots',
    bet: betAmount,
    result,
    multiplier,
    winAmount,
    tax,
    timestamp: new Date()
  });

  res.json({
    success: true,
    result,
    multiplier,
    winAmount,
    totalCoins: user.coins,
    tax,
    message: multiplier > 0 ? '🎉 تبریک! برده‌اید!' : '😢 متأسفانه باختید'
  });
});

// ========== CRASH GAME ==========
app.post('/api/games/crash/play', (req, res) => {
  const { userId, bet, cashOutMultiplier } = req.body;
  const user = users.get(parseInt(userId));

  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const betAmount = parseInt(bet);
  if (user.coins < betAmount) {
    return res.status(400).json({ error: 'سکه کافی ندارید' });
  }

  // Deduct bet
  user.coins -= betAmount;

  // Generate crash multiplier
  const crashMultiplier = (Math.random() * 15 + 1).toFixed(2);
  const playerMultiplier = parseFloat(cashOutMultiplier);

  let won = false;
  let winAmount = 0;

  if (playerMultiplier < parseFloat(crashMultiplier)) {
    won = true;
    winAmount = Math.floor(betAmount * playerMultiplier);
  }

  user.coins += winAmount;
  if (won) {
    user.totalWon += winAmount;
  } else {
    user.totalLost += betAmount;
  }
  user.gamesPlayed += 1;

  // Tax
  const tax = Math.floor(betAmount * (settings.TAX_PERCENT / 100));
  user.coins -= tax;

  const gameId = uuidv4();
  games.set(gameId, {
    id: gameId,
    userId,
    type: 'crash',
    bet: betAmount,
    playerMultiplier,
    crashMultiplier: parseFloat(crashMultiplier),
    won,
    winAmount,
    tax,
    timestamp: new Date()
  });

  res.json({
    success: true,
    crashMultiplier: parseFloat(crashMultiplier),
    playerMultiplier,
    won,
    winAmount,
    totalCoins: user.coins,
    tax,
    message: won ? '🎉 کاش‌کردن موفق!' : '💥 کرش شد!'
  });
});

// ========== BOMB GAME ==========
app.post('/api/games/bomb/play', (req, res) => {
  const { userId, bet, bombCount, safeCount, selectedCells } = req.body;
  const user = users.get(parseInt(userId));

  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const betAmount = parseInt(bet);
  if (user.coins < betAmount) {
    return res.status(400).json({ error: 'سکه کافی ندارید' });
  }

  // Create grid with bombs
  const totalCells = 25;
  const gridBombs = new Set();
  while (gridBombs.size < bombCount) {
    gridBombs.add(Math.floor(Math.random() * totalCells));
  }

  // Check selected cells
  let hitBomb = false;
  selectedCells.forEach(cell => {
    if (gridBombs.has(cell)) {
      hitBomb = true;
    }
  });

  user.coins -= betAmount;

  let multiplier = 0;
  let winAmount = 0;

  if (!hitBomb) {
    const safeFound = selectedCells.length;
    multiplier = 1 + (safeFound / (totalCells - bombCount)) * 9; // Up to 10x
    winAmount = Math.floor(betAmount * multiplier);
    user.coins += winAmount;
    user.totalWon += winAmount;
  } else {
    user.totalLost += betAmount;
  }

  user.gamesPlayed += 1;

  // Tax
  const tax = Math.floor(betAmount * (settings.TAX_PERCENT / 100));
  user.coins -= tax;

  const gameId = uuidv4();
  games.set(gameId, {
    id: gameId,
    userId,
    type: 'bomb',
    bet: betAmount,
    bombCount,
    safeCount,
    hitBomb,
    multiplier: multiplier.toFixed(2),
    winAmount,
    tax,
    timestamp: new Date()
  });

  res.json({
    success: true,
    gridBombs: Array.from(gridBombs),
    selectedCells,
    hitBomb,
    multiplier: multiplier.toFixed(2),
    winAmount,
    totalCoins: user.coins,
    tax,
    message: hitBomb ? '💣 بمب خوردید!' : '✅ امن بودید!'
  });
});

// ========== ARENA GAME (PvE with AI) ==========
app.post('/api/games/arena/join', (req, res) => {
  const { userId, bet } = req.body;
  const user = users.get(parseInt(userId));

  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const betAmount = parseInt(bet);
  if (user.coins < betAmount) {
    return res.status(400).json({ error: 'سکه کافی ندارید' });
  }

  const arenaId = uuidv4();
  const arena = {
    id: arenaId,
    type: 'arena',
    status: 'waiting',
    players: [
      {
        userId,
        bet: betAmount,
        progress: 0,
        won: false
      }
    ],
    createdAt: new Date(),
    startsAt: new Date(Date.now() + 20000) // 20 seconds
  };

  arenas.set(arenaId, arena);

  // Add AI opponent after 5 seconds
  setTimeout(() => {
    arena.players.push({
      userId: 'ai_' + uuidv4(),
      isAI: true,
      bet: betAmount,
      progress: 0,
      won: false
    });

    // Start game after 20 seconds
    setTimeout(() => {
      runArenaGame(arenaId);
    }, 15000);
  }, 5000);

  user.coins -= betAmount;

  res.json({
    success: true,
    arenaId,
    status: 'joined',
    message: 'شما به آرنا پیوستید! منتظر حریف...',
    startsIn: 20
  });
});

// ========== PVP MATCH (Player vs Player with Wheel) ==========
app.post('/api/games/pvp/create', (req, res) => {
  const { userId, bet } = req.body;
  const user = users.get(parseInt(userId));

  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

  const betAmount = parseInt(bet);
  if (user.coins < betAmount) {
    return res.status(400).json({ error: 'سکه کافی ندارید' });
  }

  const matchId = uuidv4();
  const pvpMatch = {
    id: matchId,
    type: 'pvp',
    status: 'waiting',
    bank: 0,
    players: [
      {
        userId,
        bet: betAmount,
        wheelSegment: 0,
        joinedAt: new Date()
      }
    ],
    createdAt: new Date(),
    startsAt: new Date(Date.now() + 20000) // 20 seconds after 2nd player joins
  };

  pvpMatches.set(matchId, pvpMatch);
  user.coins -= betAmount;
  pvpMatch.bank += betAmount;

  res.json({
    success: true,
    matchId,
    status: 'created',
    waitingFor: 'دومین بازیکن',
    startsIn: 'هنگام ورود دومین بازیکن'
  });
});

app.post('/api/games/pvp/join', (req, res) => {
  const { userId, matchId, bet } = req.body;
  const user = users.get(parseInt(userId));
  const pvpMatch = pvpMatches.get(matchId);

  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });
  if (!pvpMatch) return res.status(404).json({ error: 'بازی یافت نشد' });
  if (pvpMatch.status !== 'waiting') return res.status(400).json({ error: 'این بازی شروع شده است' });
  if (pvpMatch.players.length >= 2) return res.status(400).json({ error: 'تعداد بازیکنان کامل است' });

  const betAmount = parseInt(bet);
  if (user.coins < betAmount) {
    return res.status(400).json({ error: 'سکه کافی ندارید' });
  }

  const totalPlayers = pvpMatch.players.length;
  pvpMatch.players.push({
    userId,
    bet: betAmount,
    wheelSegment: totalPlayers,
    joinedAt: new Date()
  });

  user.coins -= betAmount;
  pvpMatch.bank += betAmount;

  // Start game 20 seconds after 2nd player
  setTimeout(() => {
    runPVPGame(matchId);
  }, 20000);

  res.json({
    success: true,
    matchId,
    status: 'joined',
    totalPlayers: pvpMatch.players.length,
    bank: pvpMatch.bank,
    startsIn: 20,
    message: 'شما به بازی PVP پیوستید! بازی 20 ثانیه بعد شروع می‌شود'
  });
});

// ========== SPIN WHEEL (PVP) ==========
app.post('/api/games/pvp/spin', (req, res) => {
  const { matchId } = req.body;
  const pvpMatch = pvpMatches.get(matchId);

  if (!pvpMatch) return res.status(404).json({ error: 'بازی یافت نشد' });
  if (pvpMatch.status !== 'spinning') return res.status(400).json({ error: 'زمان چرخاندن نیست' });

  res.json({
    success: true,
    message: 'گردونه در حال چرخش...'
  });
});

// ========== ADMIN SETTINGS ==========
app.get('/api/admin/settings', (req, res) => {
  const adminKey = req.query.key;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'غیرمجاز' });
  }

  res.json(settings);
});

app.post('/api/admin/settings', (req, res) => {
  const adminKey = req.query.key;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'غیرمجاز' });
  }

  const { TAX_PERCENT, MIN_WITHDRAW, SLOTS_PRICE, CRASH_PRICE, BOMB_PRICE, ARENA_PRICE, PVP_PRICE } = req.body;

  if (TAX_PERCENT !== undefined) settings.TAX_PERCENT = TAX_PERCENT;
  if (MIN_WITHDRAW !== undefined) settings.MIN_WITHDRAW = MIN_WITHDRAW;
  if (SLOTS_PRICE !== undefined) settings.SLOTS_PRICE = SLOTS_PRICE;
  if (CRASH_PRICE !== undefined) settings.CRASH_PRICE = CRASH_PRICE;
  if (BOMB_PRICE !== undefined) settings.BOMB_PRICE = BOMB_PRICE;
  if (ARENA_PRICE !== undefined) settings.ARENA_PRICE = ARENA_PRICE;
  if (PVP_PRICE !== undefined) settings.PVP_PRICE = PVP_PRICE;

  res.json({
    success: true,
    message: 'تنظیمات به‌روزرسانی شد',
    settings
  });
});

// ========== GAME HISTORY ==========
app.get('/api/user/:userId/history', (req, res) => {
  const { userId } = req.params;
  const userGames = Array.from(games.values()).filter(g => g.userId === parseInt(userId));

  res.json({
    total: userGames.length,
    games: userGames.slice(-20) // Last 20 games
  });
});

// ============================================
// GAME LOGIC FUNCTIONS
// ============================================

function runArenaGame(arenaId) {
  const arena = arenas.get(arenaId);
  if (!arena) return;

  arena.status = 'running';

  // Simulate game - run for 10 seconds
  let gameTime = 0;
  const gameInterval = setInterval(() => {
    gameTime += 0.1;
    arena.players.forEach(player => {
      player.progress = Math.min(gameTime * 10, 100);
    });

    if (gameTime >= 10) {
      clearInterval(gameInterval);
      endArenaGame(arenaId);
    }
  }, 100);
}

function endArenaGame(arenaId) {
  const arena = arenas.get(arenaId);
  if (!arena) return;

  arena.status = 'ended';

  // Random winner
  const winner = arena.players[Math.floor(Math.random() * arena.players.length)];
  winner.won = true;

  // Calculate total bank
  const totalBank = arena.players.reduce((sum, p) => sum + p.bet, 0);

  // Apply tax
  const tax = Math.floor(totalBank * (settings.TAX_PERCENT / 100));
  const winAmount = totalBank - tax;

  // Add to winner
  if (!winner.isAI) {
    const winnerUser = users.get(winner.userId);
    if (winnerUser) {
      winnerUser.coins += winAmount;
      winnerUser.totalWon += winAmount;
    }
  }

  // Notify players via WebSocket
  broadcastGame({
    type: 'arena_ended',
    arenaId,
    winner: winner.userId,
    winAmount,
    totalBank
  });
}

function runPVPGame(matchId) {
  const pvpMatch = pvpMatches.get(matchId);
  if (!pvpMatch) return;

  pvpMatch.status = 'spinning';

  // Spin wheel
  const segments = pvpMatch.players.length;
  setTimeout(() => {
    const winner = pvpMatch.players[Math.floor(Math.random() * segments)];
    endPVPGame(matchId, winner);
  }, 3000);
}

function endPVPGame(matchId, winner) {
  const pvpMatch = pvpMatches.get(matchId);
  if (!pvpMatch) return;

  pvpMatch.status = 'ended';
  winner.won = true;

  // Apply tax
  const tax = Math.floor(pvpMatch.bank * (settings.TAX_PERCENT / 100));
  const winAmount = pvpMatch.bank - tax;

  // Add to winner
  const winnerUser = users.get(winner.userId);
  if (winnerUser) {
    winnerUser.coins += winAmount;
    winnerUser.totalWon += winAmount;
  }

  // Notify players
  broadcastGame({
    type: 'pvp_ended',
    matchId,
    winner: winner.userId,
    winAmount,
    totalBank: pvpMatch.bank
  });
}

// ============================================
// WEBSOCKET
// ============================================

function broadcastGame(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// ============================================
// STATIC FILES & MINI APP
// ============================================

app.use(express.static('public'));

app.get('/mini-app', (req, res) => {
  res.sendFile(__dirname + '/public/mini-app/index.html');
});

// ============================================
// SERVER START
// ============================================

server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📱 Telegram Bot is polling...`);
  console.log(`🎮 Mini App: ${MINI_APP_URL}`);
});

module.exports = { app, server, bot };
