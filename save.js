const MANUAL_SAVE_KEY = 'savedata';
const AUTO_SAVE_KEY = 'autosavedata';

function getSaveData() {
  return {
    player:              JSON.parse(JSON.stringify(player)),
    elapsedTime,
    exploreCounts:       JSON.parse(JSON.stringify(exploreCounts)),
    exploreCooldown:     JSON.parse(JSON.stringify(exploreCooldown)),
    currentPlace,
    placeLayers:         JSON.parse(JSON.stringify(placeLayers)),
    maxLayers:           JSON.parse(JSON.stringify(maxLayers)),
    placeKillCounts:     JSON.parse(JSON.stringify(placeKillCounts)),
    itemCounts:          JSON.parse(JSON.stringify(itemCounts)),
    hasCampfire, campfireFuel, campfireHours, hasRaft,
    keiState, keiTalkCount, forest8EventDone, keiHealDone, keiPlazaArrived,
    forest3EventDone,
    placeAdvanceReady: JSON.parse(JSON.stringify(placeAdvanceReady)),
    placeExploreKillBonus: JSON.parse(JSON.stringify(placeExploreKillBonus)),
    placeAdvanceKillCounts: JSON.parse(JSON.stringify(placeAdvanceKillCounts)),
    labUnlocked, labHasKey, labGunTaken, labNaotoMet, labNaotoDead,
    hasLabRecord, labGlueMaterialTaken, currentRoom, snakeFirstKill,
    cave6DoorFound, cave6TransceiverLost,
    keiLabTalkCounts: JSON.parse(JSON.stringify(keiLabTalkCounts)),
  };
}

function saveGame() {
  if (battle.active) { showMessage('戦闘中はセーブできません。'); return; }
  try {
    localStorage.setItem(MANUAL_SAVE_KEY, JSON.stringify(getSaveData()));
    let prevSave = textZone ? textZone.elt.innerHTML : '';
    showMessage('セーブしました。（経過時間：' + elapsedTime + '時間）', true, () => { if(prevSave) showMessage(prevSave); });
    updateParams(); // セーブボタンの状態更新
  } catch(e) {
    showMessage('セーブに失敗しました：' + e.message);
  }
}

function autoSaveGame() {
  if (battle.active) return;
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(getSaveData()));
  } catch (e) {
    addDebugLog('[WARN] オートセーブ失敗: ' + e.message);
  }
}

function showLoadMenu() {
  actionPanel.html('');
  showMessage('ロードするセーブデータを選んでください。');
  if (localStorage.getItem(MANUAL_SAVE_KEY)) {
    createButton('通常セーブ').parent(actionPanel)
      .mousePressed(() => loadAndRefresh(MANUAL_SAVE_KEY));
  }
  if (localStorage.getItem(AUTO_SAVE_KEY)) {
    createButton('オートセーブ').parent(actionPanel)
      .mousePressed(() => loadAndRefresh(AUTO_SAVE_KEY));
  }
  createButton('戻る').parent(actionPanel)
    .mousePressed(() => showMainActions());
}

function resetBattleState() {
  battle.active = false;
  battle.enemyName = '';
  battle.enemyHp = 0;
  battle.enemyMaxHp = 0;
  battle.enemyAtk = 0;
  battle.enemyRange = 0;
  battle.distance = 0;
  battle.playerTurn = true;
  battle.place = '';
  battle.turns = 0;
  battle.killCount = 0;
  battle.isSeaBoss = false;
  battle.isNaoto = false;
  battle.isAdvance = false;
  battle.strongAttackCounter = 0;
  battle.feedThisTurn = false;
  battle.enemyStopTurns = 0;
}

function loadGame(saveKey = MANUAL_SAVE_KEY) {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) { showMessage('セーブデータがありません。'); return false; }
    const d = JSON.parse(raw);
    player.hp    = d.player.hp;
    player.mp    = d.player.mp;
    elapsedTime  = d.elapsedTime;
    Object.assign(exploreCounts,   d.exploreCounts   || {});
    Object.assign(exploreCooldown, d.exploreCooldown || {});
    currentPlace = d.currentPlace;
    Object.assign(placeLayers, d.placeLayers || {});
    Object.assign(maxLayers,   d.maxLayers   || {});
    Object.assign(placeKillCounts, d.placeKillCounts || {});
    // itemCountsは完全置換
    for (let k in itemCounts) delete itemCounts[k];
    Object.assign(itemCounts, d.itemCounts || {});
    hasCampfire          = !!d.hasCampfire;
    campfireFuel         = d.campfireFuel   || 0;
    campfireHours        = d.campfireHours  || 0;
    hasRaft              = !!d.hasRaft;
    selectedItem         = null;
    keiState             = d.keiState             || 'unknown';
    keiTalkCount         = d.keiTalkCount         || 0;
    forest8EventDone     = !!d.forest8EventDone;
    keiHealDone          = !!d.keiHealDone;
    keiPlazaArrived      = !!d.keiPlazaArrived;
    forest3EventDone     = !!d.forest3EventDone;
    Object.assign(placeAdvanceReady, d.placeAdvanceReady || {});
    Object.assign(placeExploreKillBonus, d.placeExploreKillBonus || {});
    Object.assign(placeAdvanceKillCounts, d.placeAdvanceKillCounts || {});
    labUnlocked          = !!d.labUnlocked;
    labHasKey            = !!d.labHasKey;
    labGunTaken          = !!d.labGunTaken;
    labNaotoMet          = !!d.labNaotoMet;
    labNaotoDead         = !!d.labNaotoDead;
    labGlueMaterialTaken = !!d.labGlueMaterialTaken;
    hasLabRecord         = !!d.hasLabRecord;
    snakeFirstKill = !!d.snakeFirstKill;
    cave6DoorFound = !!d.cave6DoorFound;
    cave6TransceiverLost = !!d.cave6TransceiverLost;
    currentRoom          = d.currentRoom || null;
    if (d.keiLabTalkCounts) Object.assign(keiLabTalkCounts, d.keiLabTalkCounts);
    resetBattleState();
    return true;
  } catch(e) {
    showMessage('ロードに失敗しました：' + e.message);
    return false;
  }
}

// ロード後に画面を再構築
function loadAndRefresh(saveKey = MANUAL_SAVE_KEY) {
  if (loadGame(saveKey)) {
    resetMessageState();
    state = 'game';
    // タイトル画面からのロード時はDOMを再構築
    if (!document.getElementById('leftWindow')) {
      container.elt.id = 'container';
      container.html('');
      container.style('flex-direction', 'row');
      container.style('justify-content', '');
      container.style('align-items', '');
      container.style('background', '');
      container.style('overflow-y', '');
      leftWindow  = createDiv().id('leftWindow').parent(container);
      leftTop     = createDiv().id('leftTop').parent(leftWindow);
      createDiv().id('infoOverlay').parent(leftTop);
      leftBottom  = createDiv().id('leftBottom').parent(leftWindow);
      textZone    = createDiv().id('textZone').parent(leftBottom);
      actionPanel = createDiv().id('actionPanel').parent(leftBottom);
      rightWindow = createDiv().id('rightWindow').parent(container);
    }
    updateBgImage(currentRoom || currentPlace);
    updateElapsedTime();
    updateParams();
    showMainActions();
  }
}

// =====================
// ゲームオーバー
// =====================
function gameOver() {
  state = 'gameover';
  battle.active = false;
  clearUI();
  container.html('');
  let overDiv = createDiv().parent(container);
  overDiv.elt.style.cssText = `
    width:100%; height:100%;
    display:flex; flex-direction:column;
    justify-content:center; align-items:center;
    background: radial-gradient(ellipse at center, #2a0a0a 0%, #0d0000 70%);
  `;
  createDiv().parent(overDiv).html(
    '<div style="font-family:Cinzel,serif;font-size:clamp(36px,6vw,72px);color:#c0503a;letter-spacing:0.15em;text-shadow:0 0 30px rgba(192,80,58,0.8)">GAME OVER</div>'
  );
  createDiv().parent(overDiv).html(
    `<div style="color:#7a5550;font-size:clamp(14px,2vw,20px);margin-top:16px">経過時間：${elapsedTime} 時間</div>`
  );
  let btn = createButton('タイトルに戻る').parent(overDiv);
  btn.elt.style.cssText = 'margin-top:40px;font-size:clamp(14px,2vw,20px);padding:14px 40px;background:transparent;border:1px solid #7a5550;color:#c0503a;cursor:pointer;letter-spacing:0.1em;';
  btn.mousePressed(() => location.reload());
}

function clearUI() {
  leftWindow.remove();
  rightWindow.remove();
}
