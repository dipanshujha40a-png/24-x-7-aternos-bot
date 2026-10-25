const mineflayer = require('mineflayer');
const settings = require('./settings.json');
const { log } = require('./logger');

let bot;
let reconnectTimer;

function connect() {
  if (!settings.host || settings.host === 'YOUR_SERVER_ADDRESS') {
    console.error('Open settings.json and set your Aternos server address first.');
    process.exit(1);
  }

  const options = {
    host: settings.host,
    port: Number(settings.port || 25565),
    username: settings.username || 'AFK_Bot'
  };
  if (settings.version) options.version = settings.version;

  log(`Connecting to ${options.host}:${options.port}...`);
  bot = mineflayer.createBot(options);

  bot.once('spawn', () => {
    log('Bot joined the server.');
    if (settings.antiAfk) {
      // Small periodic movement to avoid standing completely still.
      setInterval(() => {
        if (!bot || !bot.entity) return;
        bot.setControlState('sneak', true);
        setTimeout(() => {
          if (bot) bot.setControlState('sneak', false);
        }, 700);
      }, 45000);
    }

    if (Array.isArray(settings.chatMessages) && settings.chatMessages.length) {
      setInterval(() => {
        if (!bot || !bot.entity) return;
        const message = settings.chatMessages[
          Math.floor(Math.random() * settings.chatMessages.length)
        ];
        if (message) bot.chat(String(message).slice(0, 200));
      }, Math.max(30, Number(settings.chatIntervalSeconds || 120)) * 1000);
    }
  });

  bot.on('kicked', reason => log(`Kicked: ${JSON.stringify(reason)}`));
  bot.on('error', err => log(`Error: ${err.message}`));
  bot.on('end', () => {
    log('Disconnected from server.');
    if (settings.reconnect) {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, Math.max(5, Number(settings.reconnectDelaySeconds || 20)) * 1000);
    }
  });
}

connect();
