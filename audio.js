let audioContext = null;
let currentBgm = null;
let bgmVolume = Number(localStorage.getItem('bgmVolume') || '0.28');
let seVolume = Number(localStorage.getItem('seVolume') || '0.55');

const seFiles = {
  select: 'se/select.ogg',
  discovery: 'se/discovery.ogg',
  rangedAttack: 'se/rangedAttack.ogg',
  destroyed: 'se/destroyed.ogg',
};

const bgmFiles = {
  plaza: 'bgm/plaza.ogg',
  forest: 'bgm/forest.ogg',
  cave: 'bgm/cave.ogg',
  lab: 'bgm/lab.ogg',
  forestBattle: 'bgm/forestBattle.ogg',
  caveBattle: 'bgm/caveBattle.ogg',
  labBattle: 'bgm/labBattle.ogg',
  boss: 'bgm/boss.ogg',
};

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playSfx(type = 'click') {
  if (type !== 'discovery' && type !== 'rangedAttack' && type !== 'destroyed') type = 'select';
  const file = seFiles[type];
  if (file) {
    const sound = new Audio(file);
    sound.volume = seVolume;
    sound.play().catch(() => {});
    return;
  }
  const context = getAudioContext();
  if (!context) return;
  const settings = {
    click: [520, 0.04, 'sine'],
    explore: [180, 0.12, 'triangle'],
    battle: [90, 0.18, 'sawtooth'],
    hit: [70, 0.12, 'square'],
    heal: [660, 0.16, 'sine'],
  }[type] || [440, 0.06, 'sine'];
  const [frequency, duration, wave] = settings;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.02);
}

function startBgm() {
  playBgm('plaza');
}

function playBgm(type) {
  const file = bgmFiles[type];
  if (!file) return;
  if (currentBgm && currentBgm.src.endsWith(file)) {
    currentBgm.volume = bgmVolume;
    if (currentBgm.paused) currentBgm.play().catch(() => {});
    return;
  }
  stopBgm();
  currentBgm = new Audio(file);
  currentBgm.loop = true;
  currentBgm.volume = bgmVolume;
  currentBgm.play().catch(() => {});
}

function setBgmVolume(value) {
  bgmVolume = Math.min(1, Math.max(0, Number(value)));
  localStorage.setItem('bgmVolume', String(bgmVolume));
  if (currentBgm) currentBgm.volume = bgmVolume;
}

function setSeVolume(value) {
  seVolume = Math.min(1, Math.max(0, Number(value)));
  localStorage.setItem('seVolume', String(seVolume));
}

function stopBgm() {
  if (!currentBgm) return;
  currentBgm.pause();
  currentBgm.currentTime = 0;
  currentBgm = null;
}
