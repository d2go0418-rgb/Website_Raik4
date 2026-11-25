// 画像の読み込みが終わってからフェードインを開始します。
const homeArt = document.querySelector(".home-art");
const showHomeArt = () => homeArt.classList.add("is-loaded");

// キャッシュ済みの場合は、すでに読み込みが終わっていることがあります。
if (homeArt.complete && homeArt.naturalWidth > 0) {
  showHomeArt();
} else {
  homeArt.addEventListener("load", showHomeArt, { once: true });
}

// HTMLのidを使って、操作するボタンと表示欄を取得します。
const enterButton = document.getElementById("enter-button");
const statusMessage = document.getElementById("status");
const backgroundMusic = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");
const volumeSlider = document.getElementById("volume-slider");
const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");
let activeMusicMode = "hideout";
let hideoutVolume = Number(volumeSlider.value);
let logroomVolume = Math.min(hideoutVolume, 7);
const titleScreen = document.getElementById("title-screen");
const eventScreen = document.getElementById("event-screen");
const logroomIntroScreen = document.getElementById("logroom-intro-screen");
const logroomLibraryScreen = document.getElementById("logroom-library-screen");
const logroomTrackScreen = document.getElementById("logroom-track-screen");
const logroomNextScreen = document.getElementById("logroom-next-screen");
const logroomMainLogButton = document.getElementById("logroom-main-log");
const logroomOpenButton = document.getElementById("logroom-open");
const traceRateValue = document.getElementById("trace-rate-value");
const traceRateBar = document.getElementById("trace-rate-bar");
const browserProgressKey = "raik4-browser-progress-v1";
function readBrowserProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(browserProgressKey) || "{}");
    const validChapters = (chapters) => Array.isArray(chapters)
      ? chapters.map(Number).filter((chapter) => Number.isInteger(chapter) && chapter >= 1 && chapter <= 5)
      : [];
    return {
      hideoutCompleted: validChapters(saved.hideoutCompleted),
      logroomCompleted: validChapters(saved.logroomCompleted).filter((chapter) => chapter <= 4),
      logroomAnswerSeen: saved.logroomAnswerSeen === true,
      logroomAnswerQualified: saved.logroomAnswerQualified === true
    };
  } catch {
    return { hideoutCompleted: [], logroomCompleted: [], logroomAnswerSeen: false, logroomAnswerQualified: false };
  }
}
const savedBrowserProgress = readBrowserProgress();
const logroomCompletedChapters = new Set(savedBrowserProgress.logroomCompleted);
let isMainLogSelected = false;
let isLogroomAnswerQualified = savedBrowserProgress.logroomAnswerQualified;
let hasSeenLogroomAnswerStory = savedBrowserProgress.logroomAnswerSeen;
let answerStoryReturnScreen = logroomLibraryScreen;
function saveBrowserProgress() {
  try {
    window.localStorage.setItem(browserProgressKey, JSON.stringify({
      hideoutCompleted: [...completedChapters],
      logroomCompleted: [...logroomCompletedChapters],
      logroomAnswerSeen: hasSeenLogroomAnswerStory,
      logroomAnswerQualified: isLogroomAnswerQualified
    }));
  } catch {
    // ストレージが使えない場合は、このページを開いている間だけ進捗を保持します。
  }
}
function getNextLogroomChapter() {
  for (let chapter = 1; chapter <= 4; chapter += 1) {
    if (!logroomCompletedChapters.has(chapter)) return chapter;
  }
  return 5;
}
function updateTraceRate() {
  const traceRate = 70 + logroomCompletedChapters.size * 5;
  traceRateValue.textContent = `${traceRate}%`;
  traceRateBar.style.setProperty("--trace-rate", `${traceRate}%`);
  traceRateBar.setAttribute("aria-valuenow", String(traceRate));
}
function updateMainLogAvailability() {
  const allChaptersRead = logroomCompletedChapters.size === 4;
  logroomMainLogButton.disabled = !allChaptersRead;
  logroomOpenButton.disabled = !allChaptersRead || !isMainLogSelected;
  logroomMainLogButton.setAttribute("aria-label", !allChaptersRead
    ? "MAIN_LOGは01から04をすべて読了すると選択できます。"
    : isMainLogSelected ? "MAIN_LOGを選択中。OPENボタンで開けます。" : "MAIN_LOGを選択。OPENボタンで開けます。");
}
updateTraceRate();
updateMainLogAvailability();
const hideoutScreen = document.getElementById("hideout-screen");
const echoScreen = document.getElementById("echo-screen");
const unlockScreen = document.getElementById("unlock-screen");
const openChapterFiveButton = document.getElementById("open-chapter-five");
const logroomIntroSeenKey = "raik4-logroom-intro-seen";
let hasSeenLogroomIntro = false;
try {
  hasSeenLogroomIntro = window.localStorage.getItem(logroomIntroSeenKey) === "true";
} catch {
  // ストレージが使えない場合は、現在のページ内だけで初回表示を管理します。
}
// 章の読了状況はブラウザー内に保存し、次回も続きから再開します。
const completedChapters = new Set(savedBrowserProgress.hideoutCompleted);
function getNextHideoutChapter() {
  for (let chapter = 1; chapter <= 4; chapter += 1) {
    if (!completedChapters.has(chapter)) return chapter;
  }
  return 5;
}
function updateChapterFiveButton() {
  openChapterFiveButton.disabled = ![1, 2, 3, 4].every((chapter) => completedChapters.has(chapter));
}
updateChapterFiveButton();
let isTransitioning = false;
const screenFadeDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2000;
function playScreenAnimation(screen, className) {
  if (!screenFadeDuration) return Promise.resolve();
  screen.classList.remove("is-leaving", "is-entering", "fade");
  void screen.offsetWidth;
  screen.classList.add(className);
  return new Promise((resolve) => {
    const onAnimationEnd = (event) => {
      if (event.target !== screen) return;
      screen.removeEventListener("animationend", onAnimationEnd);
      resolve();
    };
    if (className !== "fade") screen.addEventListener("animationend", onAnimationEnd);
    window.setTimeout(() => {
      screen.removeEventListener("animationend", onAnimationEnd);
      resolve();
    }, screenFadeDuration + 100);
  }).then(() => screen.classList.remove(className));
}
async function transitionScreens(currentScreen, nextScreen, onEnter, enterAnimation = "is-entering") {
  if (isTransitioning) return;
  isTransitioning = true;
  await playScreenAnimation(currentScreen, "is-leaving");
  currentScreen.hidden = true;
  nextScreen.hidden = false;
  document.body.classList.toggle("hideout-audio-theme", nextScreen === hideoutScreen);
  document.body.classList.toggle("event-menu-active", nextScreen === eventScreen
    || (nextScreen === resultPostScreen && resultReturnScreen === eventScreen));
  if (onEnter) onEnter();
  await playScreenAnimation(nextScreen, enterAnimation);
  isTransitioning = false;
}
// 音量は0.0〜1.0で指定します。Hideoutは15%、LOGROOMは7%を上限にします。
backgroundMusic.volume = Number(volumeSlider.value) / 100;
function switchBackgroundMusic(mode) {
  activeMusicMode = mode;
  const isLogroomMusic = mode === "logroom";
  trackTitle.textContent = isLogroomMusic ? "Don’t Know Your Name!!" : "OUTPUT";
  trackArtist.textContent = "VOLTA";
  volumeSlider.max = isLogroomMusic ? "7" : "15";
  volumeSlider.value = String(isLogroomMusic ? logroomVolume : hideoutVolume);
  volumeSlider.setAttribute("aria-label", `BGM音量 ${volumeSlider.value}％`);
  backgroundMusic.volume = Number(volumeSlider.value) / 100;
  backgroundMusic.src = isLogroomMusic ? "assets/raikas-logroom.mp3" : "assets/raikas-hideout.mp3";
  backgroundMusic.load();
  backgroundMusic.play().catch(() => {});
}
volumeSlider.addEventListener("input", () => {
  const volume = Number(volumeSlider.value);
  backgroundMusic.volume = volume / 100;
  if (activeMusicMode === "logroom") logroomVolume = volume;
  else hideoutVolume = volume;
  volumeSlider.setAttribute("aria-label", `BGM音量 ${volumeSlider.value}％`);
});

// 音符アイコンでBGMを再生・一時停止できます。
const updateMusicButton = () => {
  const isPlaying = !backgroundMusic.paused;
  musicButton.classList.toggle("is-paused", !isPlaying);
  musicButton.setAttribute("aria-pressed", String(isPlaying));
  musicButton.setAttribute("aria-label", isPlaying ? "BGMを一時停止" : "BGMを再生");
};
backgroundMusic.addEventListener("play", updateMusicButton);
backgroundMusic.addEventListener("pause", updateMusicButton);
updateMusicButton();
musicButton.addEventListener("click", () => {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(() => {});
  } else {
    backgroundMusic.pause();
  }
});

// 自動再生を試し、ブラウザに止められた場合はSTART操作後に再生します。
backgroundMusic.play().catch(() => {
  // 再生できない状態でも、STARTを押したときにもう一度試します。
});

// ボタンが押されたら、メッセージと文字色を変更します。
enterButton.addEventListener("click", () => {
  backgroundMusic.play().catch(() => {
    statusMessage.textContent = "BGMを再生できませんでした。ブラウザの音量設定をご確認ください。";
  });
  const destination = !isLogroomHome
    ? hideoutScreen
    : hasSeenLogroomIntro ? logroomLibraryScreen : logroomIntroScreen;
  transitionScreens(titleScreen, destination, undefined, "fade");
});

document.getElementById("logroom-continue").addEventListener("click", () => {
  hasSeenLogroomIntro = true;
  try {
    window.localStorage.setItem(logroomIntroSeenKey, "true");
  } catch {
    // ストレージが使えない場合も、現在のページ内では次回以降をスキップします。
  }
  transitionScreens(logroomIntroScreen, logroomLibraryScreen);
});

function showPendingArchiveMessage(section) {
  document.getElementById("popup-message").textContent = `${section} DATA PENDING.`;
  document.getElementById("system-popup").showModal();
}
function openLogroomStory(chapterNumber) {
  const nextChapter = getNextLogroomChapter();
  if (chapterNumber > nextChapter) {
    document.getElementById("popup-message").textContent = `READ LOGROOM 0${nextChapter} FIRST.`;
    document.getElementById("system-popup").showModal();
    return;
  }
  const pages = chapterNumber === 1 ? logroomSceneLogPages
    : chapterNumber === 2 ? logroomCharacterPages
      : chapterNumber === 3 ? logroomWorldDataPages
        : chapterNumber === 4 ? logroomExtraPages : null;
  if (!pages) {
    showPendingArchiveMessage("EXTRA");
    return;
  }
  isLogroomStory = true;
  logroomStoryNumber = chapterNumber;
  activeStoryPages = pages;
  document.getElementById("story-hideout").textContent = "Logroomに戻る";
  echoScreen.classList.add("is-logroom");
  transitionScreens(logroomLibraryScreen, echoScreen, () => {
    showStoryPage(0);
    storyPanel.focus({ preventScroll: true });
  });
}
document.querySelectorAll(".logroom-section-button").forEach((sectionButton) => {
  sectionButton.addEventListener("click", () => {
    const chapterNumber = { SCENE_LOG: 1, CHARACTER: 2, WORLD_DATA: 3, EXTRA: 4 }[sectionButton.dataset.section];
    openLogroomStory(chapterNumber);
  });
});
logroomMainLogButton.addEventListener("click", () => {
  if (logroomMainLogButton.disabled) return;
  isMainLogSelected = true;
  logroomMainLogButton.classList.add("is-selected");
  updateMainLogAvailability();
});
function openLogroomAnswerStory(fromScreen) {
  if (isTransitioning) return;
  isLogroomStory = true;
  logroomStoryNumber = 5;
  activeStoryPages = logroomAnswerPages;
  answerStoryReturnScreen = fromScreen;
  const isReplay = fromScreen === logroomTrackScreen;
  document.getElementById("story-hideout").textContent = isReplay ? "解禁画面に戻る" : "Logroomに戻る";
  echoScreen.classList.add("is-logroom");
  transitionScreens(fromScreen, echoScreen, () => {
    showStoryPage(0);
    storyPanel.focus({ preventScroll: true });
  });
}
logroomOpenButton.addEventListener("click", () => {
  if (logroomOpenButton.disabled) return;
  openLogroomAnswerStory(logroomLibraryScreen);
});
const resultPostScreen = document.getElementById("result-post-screen");
const resultPostForm = document.getElementById("result-post-form");
const resultImageInput = document.getElementById("result-image-input");
const resultDropZone = document.getElementById("result-drop-zone");
const resultPreviewList = document.getElementById("result-preview-list");
const resultHistoryList = document.getElementById("result-history-list");
const resultSubmitButton = document.getElementById("result-post-submit");
const resultPostStatus = document.getElementById("result-post-status");
const resultGlobalComment = document.getElementById("result-global-comment");
const resultNextButton = document.getElementById("result-next-button");
const hideoutRecordGrid = document.getElementById("hideout-record-grid");
const hideoutRecordCount = document.getElementById("hideout-record-count");
const pendingResultItems = [];
const submittedResultItems = [];
let nextResultId = 1;
let resultPlayType = "normal";
let resultFlowMode = "logroom";
let resultReturnScreen = logroomTrackScreen;
let activeHideoutResultChapter = null;
let defaultResultSong = "";
const sssPlusThreshold = 100.5;
let tesseractScriptPromise = null;
let resultOcrWorkerPromise = null;
let resultOcrQueue = Promise.resolve();

function parseResultScore(value) {
  const normalized = String(value ?? "").replace(/[％%\s]/g, "").replace(/,/g, ".");
  const match = normalized.match(/\d{1,3}(?:\.\d{1,4})?/);
  if (!match) return null;
  const score = Number(match[0]);
  return Number.isFinite(score) && score >= 0 && score <= 101 ? score : null;
}

function extractResultScore(ocrText) {
  const candidates = [];
  const pattern = /(\d{1,3})\s*[.,]\s*(\d{1,4})\s*([%％]?)/g;
  for (const match of ocrText.matchAll(pattern)) {
    const score = Number(`${match[1]}.${match[2]}`);
    if (score >= 0 && score <= 101) candidates.push({ score, hasPercent: Boolean(match[3]) });
  }
  const percentCandidates = candidates.filter((candidate) => candidate.hasPercent);
  const plausibleCandidates = percentCandidates.length > 0
    ? percentCandidates
    : candidates.filter((candidate) => candidate.score >= 90);
  if (plausibleCandidates.length === 0) return null;
  return plausibleCandidates.reduce((best, candidate) => candidate.score > best.score ? candidate : best).score;
}

function loadTesseractLibrary() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!tesseractScriptPromise) {
    tesseractScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
      script.async = true;
      script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("OCR engine did not initialize"));
      script.onerror = () => reject(new Error("OCR engine could not be loaded"));
      document.head.append(script);
    });
  }
  return tesseractScriptPromise;
}

function getResultOcrWorker() {
  if (!resultOcrWorkerPromise) {
    resultOcrWorkerPromise = loadTesseractLibrary()
      .then((tesseract) => tesseract.createWorker("eng"))
      .catch((error) => {
        resultOcrWorkerPromise = null;
        throw error;
      });
  }
  return resultOcrWorkerPromise;
}

function updateResultItemStatus(item, message) {
  item.ocrStatus = message;
  const status = resultPreviewList.querySelector(`[data-result-ocr-status="${item.id}"]`);
  if (status) status.textContent = message;
}

async function readResultImage(item) {
  updateResultItemStatus(item, "OCR解析中…");
  try {
    const worker = await getResultOcrWorker();
    const { data } = await worker.recognize(item.file);
    const recognizedScore = extractResultScore(data.text);
    if (data.text.toLowerCase().includes("answer") && !item.song.trim()) {
      item.song = "Answer";
      const songInput = resultPreviewList.querySelector(`[data-result-item="${item.id}"][data-result-field="song"]`);
      if (songInput) songInput.value = item.song;
    }
    if (recognizedScore !== null) {
      const recognizedText = `${recognizedScore.toFixed(4)}%`;
      const scoreInput = resultPreviewList.querySelector(`[data-result-item="${item.id}"][data-result-field="score"]`);
      if (!item.score.trim()) {
        item.score = recognizedText;
        if (scoreInput) scoreInput.value = recognizedText;
      }
      updateResultItemStatus(item, `読み取り結果 ${recognizedText} — 内容を確認してください`);
      resultPostStatus.textContent = `${item.file.name} のスコアを読み取りました。画像と入力内容を確認してください。`;
    } else {
      updateResultItemStatus(item, "スコアを読み取れません。手入力してください。");
    }
  } catch {
    updateResultItemStatus(item, "OCRを利用できません。スコアを手入力してください。");
    resultPostStatus.textContent = "OCRエンジンを読み込めませんでした。ネット接続を確認するか、スコアを手入力してください。";
  }
  updateResultSubmitButton();
}

function queueResultImageOcr(item) {
  resultOcrQueue = resultOcrQueue.then(() => readResultImage(item));
}
window.addEventListener("pagehide", () => {
  if (resultOcrWorkerPromise) resultOcrWorkerPromise.then((worker) => worker.terminate()).catch(() => {});
});

function updateResultSubmitButton() {
  const hasFiles = pendingResultItems.length > 0;
  const isComplete = hasFiles && pendingResultItems.every((item) => item.song.trim() && item.difficulty && parseResultScore(item.score) !== null);
  if (resultFlowMode === "hideout") {
    resultSubmitButton.disabled = !hasFiles;
    resultSubmitButton.textContent = hasFiles ? "SUBMIT REPORT  →" : "画像を選択してください";
    return;
  }
  resultSubmitButton.disabled = !isComplete;
  resultSubmitButton.textContent = !hasFiles ? "画像を選択してください"
    : isComplete ? "リザルトを登録" : "曲名・難易度・スコアを入力してください";
}

function createResultField(item, fieldName, labelText, placeholder, options = null) {
  const label = document.createElement("label");
  label.textContent = labelText;
  let input;
  if (options) {
    input = document.createElement("select");
    input.className = "result-field-select";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "選択";
    input.append(emptyOption);
    options.forEach((optionText) => {
      const option = document.createElement("option");
      option.value = optionText;
      option.textContent = optionText;
      input.append(option);
    });
    input.value = item[fieldName];
  } else {
    input = document.createElement("input");
    input.className = "result-field-input";
    input.type = "text";
    input.placeholder = placeholder;
    input.value = item[fieldName];
  }
  input.dataset.resultItem = String(item.id);
  input.dataset.resultField = fieldName;
  input.addEventListener("input", () => {
    item[fieldName] = input.value;
    updateResultSubmitButton();
  });
  input.addEventListener("change", () => {
    item[fieldName] = input.value;
    updateResultSubmitButton();
  });
  label.append(input);
  return label;
}

function renderPendingResultItems() {
  resultPreviewList.replaceChildren();
  resultPostScreen.classList.toggle("has-pending-result", pendingResultItems.length > 0);
  pendingResultItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "result-preview-card";
    const image = document.createElement("img");
    image.className = "result-preview-image";
    image.src = item.previewUrl;
    image.alt = `選択したリザルト画像 ${index + 1}`;
    const fields = document.createElement("div");
    fields.className = "result-preview-fields";
    const fileName = document.createElement("p");
    fileName.className = "result-preview-filename";
    fileName.textContent = `${String(index + 1).padStart(2, "0")} / ${item.file.name}`;
    const ocrStatus = document.createElement("p");
    ocrStatus.className = "result-preview-ocr-status";
    ocrStatus.dataset.resultOcrStatus = String(item.id);
    ocrStatus.textContent = item.ocrStatus || "スコアを自動読み取りします。結果を確認してください。";
    const song = createResultField(item, "song", "曲名", "曲名を入力");
    song.classList.add("result-song-field");
    const difficulty = createResultField(item, "difficulty", "難易度", "", ["BASIC", "ADVANCED", "EXPERT", "MASTER", "Re:MASTER", "OTHER"]);
    const score = createResultField(item, "score", "スコア", "例：100.0000% ");
    const comment = createResultField(item, "comment", "画像ごとのコメント", "感想を入力");
    comment.classList.add("result-image-comment-field");
    const removeButton = document.createElement("button");
    removeButton.className = "result-remove-file";
    removeButton.type = "button";
    removeButton.textContent = "削除";
    removeButton.setAttribute("aria-label", `${item.file.name}を選択リストから削除`);
    removeButton.addEventListener("click", () => {
      const itemIndex = pendingResultItems.findIndex((candidate) => candidate.id === item.id);
      if (itemIndex < 0) return;
      URL.revokeObjectURL(pendingResultItems[itemIndex].previewUrl);
      pendingResultItems.splice(itemIndex, 1);
      resultImageInput.value = "";
      renderPendingResultItems();
    });
    fields.append(fileName, ocrStatus, song, difficulty, score, removeButton, comment);
    card.append(image, fields);
    resultPreviewList.append(card);
  });
  updateResultSubmitButton();
}

function addResultImageFiles(files) {
  const imageFiles = Array.from(files).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
  const addedItems = [];
  if (imageFiles.length !== files.length) resultPostStatus.textContent = "jpg / png / webp形式の画像を選択してください。";
  imageFiles.forEach((file) => {
    const alreadyAdded = pendingResultItems.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified);
    if (alreadyAdded) return;
    const item = {
      id: nextResultId++,
      file,
      previewUrl: URL.createObjectURL(file),
      song: resultFlowMode === "hideout" ? defaultResultSong : "Answer",
      difficulty: "MASTER",
      score: "",
      comment: "",
      ocrStatus: "OCR待機中…"
    };
    pendingResultItems.push(item);
    addedItems.push(item);
  });
  if (imageFiles.length > 0) resultPostStatus.textContent = `${pendingResultItems.length}枚の画像を確認してください。`;
  renderPendingResultItems();
  addedItems.forEach(queueResultImageOcr);
}

function renderHideoutRecordSlots() {
  const slots = Array.from(hideoutRecordGrid.querySelectorAll("[data-record-slot]"));
  const logroomRecords = submittedResultItems.filter((item) => item.resultMode === "logroom");
  let recordCount = 0;
  slots.forEach((slot) => {
    const chapter = Number(slot.dataset.recordSlot);
    const record = resultFlowMode === "hideout"
      ? submittedResultItems.find((item) => item.resultMode === "hideout" && item.hideoutChapter === chapter)
      : logroomRecords[chapter - 1];
    slot.replaceChildren();
    slot.classList.toggle("has-record", Boolean(record));
    if (!record) {
      slot.setAttribute("aria-label", `File 0${chapter} リザルト未登録`);
      return;
    }
    recordCount += 1;
    slot.setAttribute("aria-label", `File 0${chapter} ${record.song} ${record.score}`);
    const image = document.createElement("img");
    image.src = record.previewUrl;
    image.alt = "";
    const details = document.createElement("div");
    details.className = "hideout-record-details";
    const title = document.createElement("strong");
    title.textContent = record.song || "RESULT RECORD";
    const score = document.createElement("span");
    score.textContent = record.score;
    const difficulty = document.createElement("small");
    difficulty.textContent = record.difficulty;
    details.append(title, score, difficulty);
    slot.append(image, details);
  });
  hideoutRecordCount.textContent = `${recordCount} / 4`;
  hideoutRecordCount.hidden = recordCount === 0;
}

function renderSubmittedResults() {
  resultHistoryList.replaceChildren();
  if (submittedResultItems.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "result-empty-state";
    emptyState.textContent = "まだリザルトはありません。";
    resultHistoryList.append(emptyState);
  } else {
    submittedResultItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "result-history-item";
      const image = document.createElement("img");
      image.src = item.previewUrl;
      image.alt = `リザルト画像：${item.song}`;
      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.song;
      const difficulty = document.createElement("p");
      difficulty.textContent = `${item.difficulty} ・ ${item.playType === "challenge" ? "チャレトラプレイ" : "通常プレイ"}`;
      const score = document.createElement("p");
      score.className = "result-history-score";
      score.textContent = item.score;
      const date = document.createElement("p");
      date.textContent = item.date;
      details.append(title, difficulty, score, date);
      if (item.globalComment || item.comment) {
        const comment = document.createElement("p");
        comment.textContent = item.comment || item.globalComment;
        details.append(comment);
      }
      card.append(image, details);
      resultHistoryList.append(card);
    });
  }
  document.getElementById("result-history-count").textContent = String(submittedResultItems.length);
  renderHideoutRecordSlots();
}

document.querySelectorAll(".result-play-type").forEach((button) => {
  button.addEventListener("click", () => {
    resultPlayType = button.dataset.playType;
    document.querySelectorAll(".result-play-type").forEach((otherButton) => {
      const isActive = otherButton === button;
      otherButton.classList.toggle("is-active", isActive);
      otherButton.setAttribute("aria-pressed", String(isActive));
    });
  });
});
resultImageInput.addEventListener("change", () => addResultImageFiles(resultImageInput.files));
resultDropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    resultImageInput.click();
  }
});
resultDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  resultDropZone.classList.add("is-dragging");
});
resultDropZone.addEventListener("dragleave", () => resultDropZone.classList.remove("is-dragging"));
resultDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  resultDropZone.classList.remove("is-dragging");
  if (event.dataTransfer) addResultImageFiles(event.dataTransfer.files);
});
resultPostForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (pendingResultItems.length === 0) {
    resultPostStatus.textContent = "画像を選択してから送信してください。";
    return;
  }
  if (resultSubmitButton.disabled) return;
  const isHideoutResult = resultFlowMode === "hideout";
  if (isHideoutResult && pendingResultItems.some((item) => !item.song.trim() || !item.difficulty || parseResultScore(item.score) === null)) {
    resultPostStatus.textContent = "曲名・難易度・スコアを確認してから送信してください。";
    return;
  }
  const date = new Date().toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const newRecords = pendingResultItems.map((item) => ({
    ...item,
    resultMode: resultFlowMode,
    hideoutChapter: isHideoutResult ? activeHideoutResultChapter : null,
    playType: resultPlayType,
    globalComment: resultGlobalComment.value.trim(),
    date
  }));
  const clearedRequirement = !isHideoutResult && newRecords.some((item) => {
    const normalizedSong = item.song.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const score = parseResultScore(item.score);
    return normalizedSong === "answer" && score !== null && score >= sssPlusThreshold;
  });
  submittedResultItems.unshift(...newRecords);
  const postedCount = pendingResultItems.length;
  pendingResultItems.length = 0;
  resultImageInput.value = "";
  resultGlobalComment.value = "";
  renderPendingResultItems();
  renderSubmittedResults();
  if (clearedRequirement) isLogroomAnswerQualified = true;
  if (clearedRequirement) saveBrowserProgress();
  resultNextButton.hidden = false;
  resultNextButton.disabled = !isHideoutResult && !isLogroomAnswerQualified;
  resultPostStatus.textContent = isHideoutResult
    ? `${postedCount}件のリザルトをこのページ内に仮登録しました。`
    : clearedRequirement
      ? `${postedCount}件を仮登録しました。AnswerでSSS+以上を確認。次のログが解放されました。`
      : isLogroomAnswerQualified
        ? `${postedCount}件をこのページ内に仮登録しました。次のログは解放済みです。`
        : `${postedCount}件を仮登録しました。Answerで${sssPlusThreshold.toFixed(4)}％以上を記録すると次へ進めます。`;
});
document.getElementById("result-post-back").addEventListener("click", () => {
  transitionScreens(resultPostScreen, resultReturnScreen);
});
resultNextButton.addEventListener("click", () => {
  if (resultFlowMode === "hideout") {
    pendingResultItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    pendingResultItems.length = 0;
    resultImageInput.value = "";
    resultGlobalComment.value = "";
    renderPendingResultItems();
    resultPostStatus.textContent = "記録はこのページ内の一時保存です。";
    const returnScreen = resultReturnScreen === eventScreen ? eventScreen : hideoutScreen;
    resultFlowMode = "logroom";
    defaultResultSong = "";
    activeHideoutResultChapter = null;
    transitionScreens(resultPostScreen, returnScreen, () => {
      if (returnScreen === eventScreen) {
        eventTrackListPopup.hidden = true;
        eventTrackListButton.focus({ preventScroll: true });
      }
    });
    return;
  }
  if (!isLogroomAnswerQualified) return;
  transitionScreens(resultPostScreen, logroomNextScreen);
});
document.getElementById("logroom-next-return").addEventListener("click", () => {
  transitionScreens(logroomNextScreen, logroomLibraryScreen);
});
document.getElementById("logroom-track-download").addEventListener("click", () => showPendingArchiveMessage("CHART DOWNLOAD"));
document.getElementById("logroom-track-result").addEventListener("click", () => {
  resultFlowMode = "logroom";
  defaultResultSong = "";
  resultReturnScreen = logroomTrackScreen;
  activeHideoutResultChapter = null;
  resultPostScreen.classList.add("is-hideout-result");
  resultNextButton.textContent = "NEXT  →";
  resultNextButton.hidden = false;
  resultNextButton.disabled = !isLogroomAnswerQualified;
  resultPostStatus.textContent = "";
  renderHideoutRecordSlots();
  updateResultSubmitButton();
  transitionScreens(logroomTrackScreen, resultPostScreen);
});
document.querySelector(".unlock-screen .result-action").addEventListener("click", () => {
  resultFlowMode = "hideout";
  defaultResultSong = "";
  resultReturnScreen = unlockScreen;
  pendingResultItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  pendingResultItems.length = 0;
  resultImageInput.value = "";
  activeHideoutResultChapter = unlockScreen.classList.contains("is-connect") ? 2
    : unlockScreen.classList.contains("is-memory") ? 3
      : unlockScreen.classList.contains("is-crossroad") ? 4
        : unlockScreen.classList.contains("is-chapter-five") ? 5 : 1;
  resultPlayType = "normal";
  resultPostScreen.classList.add("is-hideout-result");
  resultNextButton.textContent = "NEXT  →";
  resultNextButton.hidden = false;
  resultNextButton.disabled = false;
  resultPostStatus.textContent = "";
  resultGlobalComment.value = "";
  renderPendingResultItems();
  renderHideoutRecordSlots();
  updateResultSubmitButton();
  transitionScreens(unlockScreen, resultPostScreen);
});
document.getElementById("logroom-track-replay").addEventListener("click", () => {
  openLogroomAnswerStory(logroomTrackScreen);
});
document.getElementById("logroom-track-hideout").addEventListener("click", () => {
  transitionScreens(logroomTrackScreen, titleScreen);
});
document.getElementById("logroom-home-button").addEventListener("click", () => {
  transitionScreens(logroomLibraryScreen, titleScreen);
});

let isLogroomHome = false;
let isSwitchingHome = false;
const roomSwitchButton = document.getElementById("logroom-button");
const roomSwitchLabel = document.getElementById("room-switch-label");
const hideoutLogoOverlay = document.getElementById("hideout-logo-overlay");
const hideoutLogoTrigger = document.getElementById("hideout-logo-trigger");
const logroomLogoOverlay = document.getElementById("logroom-logo-overlay");
const logroomLogoTrigger = document.getElementById("logroom-logo-trigger");
const eventSiteReturnButton = document.getElementById("event-site-return");
const eventTrackListPopup = document.getElementById("event-track-list-popup");
const eventTrackListCloseButton = document.getElementById("event-track-list-close");
const eventTrackListButton = document.querySelector(".event-track-list");
const eventHowToPopup = document.getElementById("event-how-to-popup");
const eventHowToCloseButton = document.getElementById("event-how-to-close");
const eventHowToButton = document.querySelector(".event-how-to-play");
const eventMessagePopup = document.getElementById("event-message-popup");
const eventMessageCloseButton = document.getElementById("event-message-close");
const eventMessageButton = document.querySelector(".event-message");
const eventCollectionPopup = document.getElementById("event-collection-popup");
const eventCollectionButton = document.querySelector(".event-password");
const eventAccessPopup = document.getElementById("event-access-popup");
const eventAccessForm = document.getElementById("event-access-form");
const eventAccessPassword = document.getElementById("event-access-password");
const eventAccessCloseButton = document.getElementById("event-access-close");
const eventCollectionDiamondButton = document.getElementById("event-collection-diamond");
document.getElementById("event-dev-access").addEventListener("click", () => {
  transitionScreens(eventScreen, titleScreen);
});
eventSiteReturnButton.addEventListener("click", () => {
  backgroundMusic.pause();
  transitionScreens(titleScreen, eventScreen);
});
document.querySelectorAll(".event-section-button").forEach((sectionButton) => {
  sectionButton.addEventListener("click", () => {
    if (sectionButton === eventTrackListButton) {
      eventTrackListPopup.hidden = false;
      eventTrackListCloseButton.focus({ preventScroll: true });
      return;
    }
    if (sectionButton === eventHowToButton) {
      eventHowToPopup.hidden = false;
      eventHowToCloseButton.focus({ preventScroll: true });
      return;
    }
    if (sectionButton === eventMessageButton) {
      eventMessagePopup.hidden = false;
      eventMessageCloseButton.focus({ preventScroll: true });
      return;
    }
    if (sectionButton === eventCollectionButton) {
      eventCollectionPopup.hidden = false;
      document.getElementById("event-collection-close").focus({ preventScroll: true });
      return;
    }
    showPendingArchiveMessage(sectionButton.dataset.section);
  });
});
function closeEventTrackListPopup() {
  if (eventTrackListPopup.hidden) return;
  eventTrackListPopup.hidden = true;
  eventTrackListButton.focus({ preventScroll: true });
}
eventTrackListCloseButton.addEventListener("click", closeEventTrackListPopup);
function closeEventHowToPopup() {
  if (eventHowToPopup.hidden) return;
  eventHowToPopup.hidden = true;
  eventHowToButton.focus({ preventScroll: true });
}
eventHowToCloseButton.addEventListener("click", closeEventHowToPopup);
function closeEventMessagePopup() {
  if (eventMessagePopup.hidden) return;
  eventMessagePopup.hidden = true;
  eventMessageButton.focus({ preventScroll: true });
}
eventMessageCloseButton.addEventListener("click", closeEventMessagePopup);
function closeEventCollectionPopup() {
  if (eventCollectionPopup.hidden) return;
  eventCollectionPopup.hidden = true;
  eventCollectionButton.focus({ preventScroll: true });
}
document.getElementById("event-collection-close").addEventListener("click", closeEventCollectionPopup);
document.getElementById("event-collection-back").addEventListener("click", closeEventCollectionPopup);
document.querySelectorAll(".collection-card-button").forEach((collectionButton) => {
  collectionButton.addEventListener("click", () => {
    showPendingArchiveMessage(`${collectionButton.dataset.collection.toUpperCase()} COLLECTION LOCKED. RANK SSS+ REQUIRED.`);
  });
});
eventCollectionDiamondButton.addEventListener("click", () => {
  eventAccessForm.reset();
  eventAccessPopup.hidden = false;
  eventAccessPassword.focus({ preventScroll: true });
});
function closeEventAccessPopup() {
  if (eventAccessPopup.hidden) return;
  eventAccessPopup.hidden = true;
  eventAccessForm.reset();
  eventCollectionDiamondButton.focus({ preventScroll: true });
}
eventAccessCloseButton.addEventListener("click", closeEventAccessPopup);
eventAccessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (eventAccessPassword.value === "Q8N4F3K7Z6P2") {
    eventAccessPopup.hidden = true;
    eventCollectionPopup.hidden = true;
    eventAccessForm.reset();
    transitionScreens(eventScreen, titleScreen);
    return;
  }
  const message = /^[A-Za-z0-9]{12}$/.test(eventAccessPassword.value)
    ? "パスワードが違います。"
    : "半角英数字12文字を入力してください。";
  document.getElementById("popup-message").textContent = message;
  document.getElementById("system-popup").showModal();
});
document.querySelectorAll(".track-popup-action").forEach((actionButton) => {
  actionButton.addEventListener("click", () => {
    const { action, song } = actionButton.dataset;
    if (action === "back") {
      closeEventTrackListPopup();
      return;
    }
    if (action === "download" || action === "ranking") {
      showPendingArchiveMessage(`${song} ${action === "download" ? "CHART DOWNLOAD" : "RANKING"}`);
      return;
    }
    resultFlowMode = "hideout";
    resultReturnScreen = eventScreen;
    activeHideoutResultChapter = null;
    defaultResultSong = song;
    pendingResultItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    pendingResultItems.length = 0;
    resultImageInput.value = "";
    resultPlayType = "normal";
    resultPostScreen.classList.add("is-hideout-result");
    resultNextButton.textContent = "NEXT  →";
    resultNextButton.hidden = false;
    resultNextButton.disabled = false;
    resultPostStatus.textContent = "";
    resultGlobalComment.value = "";
    renderPendingResultItems();
    renderHideoutRecordSlots();
    updateResultSubmitButton();
    transitionScreens(eventScreen, resultPostScreen);
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !document.getElementById("system-popup").open) {
    if (!eventAccessPopup.hidden) {
      closeEventAccessPopup();
    } else {
      closeEventTrackListPopup();
      closeEventHowToPopup();
      closeEventMessagePopup();
      closeEventCollectionPopup();
    }
  }
});
roomSwitchButton.addEventListener("click", () => {
  if (isSwitchingHome) return;
  isSwitchingHome = true;
  switchBackgroundMusic(isLogroomHome ? "hideout" : "logroom");
  const nextImage = new Image();
  const nextSource = isLogroomHome ? "assets/hideout-home-background-v2.png" : "assets/logroom-home-background-v2.png";
  nextImage.addEventListener("load", () => {
    homeArt.classList.add("is-switching");
    window.setTimeout(() => {
      homeArt.src = nextSource;
      homeArt.alt = isLogroomHome ? "紫の光に包まれた雷華の部屋" : "ノイズが走る、雷華のLogroom";
      isLogroomHome = !isLogroomHome;
      hideoutLogoOverlay.hidden = isLogroomHome;
      hideoutLogoTrigger.hidden = isLogroomHome;
      logroomLogoOverlay.hidden = !isLogroomHome;
      logroomLogoTrigger.hidden = !isLogroomHome;
      roomSwitchLabel.textContent = isLogroomHome ? "Hideout" : "Logroom";
      roomSwitchButton.setAttribute("aria-label", isLogroomHome ? "Hideoutへ切り替え" : "Logroomへ切り替え");
      homeArt.classList.remove("is-switching");
      isSwitchingHome = false;
    }, 220);
  }, { once: true });
  nextImage.addEventListener("error", () => {
    isSwitchingHome = false;
  }, { once: true });
  nextImage.src = nextSource;
});
function transitionToLogroomHomeFromStory() {
  const nextSource = "assets/logroom-home-background-v2.png";
  const nextImage = new Image();
  const enterLogroomHome = () => {
    homeArt.src = nextSource;
    homeArt.alt = "ノイズが走る、雷華のLogroom";
    isLogroomHome = true;
    hideoutLogoOverlay.hidden = true;
    hideoutLogoTrigger.hidden = true;
    logroomLogoOverlay.hidden = false;
    logroomLogoTrigger.hidden = false;
    roomSwitchLabel.textContent = "Hideout";
    roomSwitchButton.setAttribute("aria-label", "Hideoutへ切り替え");
    switchBackgroundMusic("logroom");
    transitionScreens(echoScreen, titleScreen);
  };
  nextImage.addEventListener("load", enterLogroomHome, { once: true });
  nextImage.addEventListener("error", enterLogroomHome, { once: true });
  nextImage.src = nextSource;
}

// 4つのカードは同じ案内ポップアップを表示します。
document.querySelectorAll(".card-button").forEach((card) => {
  card.addEventListener("click", () => {
    if (card.classList.contains("card-echo") || card.classList.contains("card-connect") || card.classList.contains("card-memory") || card.classList.contains("card-crossroad")) {
      const chapterNumber = card.classList.contains("card-echo") ? 1
        : card.classList.contains("card-connect") ? 2
          : card.classList.contains("card-memory") ? 3 : 4;
      const nextChapter = getNextHideoutChapter();
      if (chapterNumber > nextChapter) {
        document.getElementById("popup-message").textContent = `READ CHAPTER 0${nextChapter} FIRST.`;
        document.getElementById("system-popup").showModal();
        return;
      }
      isLogroomStory = false;
      activeStoryPages = card.classList.contains("card-echo")
        ? echoStoryPages
        : card.classList.contains("card-connect") ? connectStoryPages
          : card.classList.contains("card-memory") ? memoryStoryPages : crossroadStoryPages;
      transitionScreens(hideoutScreen, echoScreen, () => {
        document.getElementById("story-hideout").textContent = "Hideoutに戻る";
        echoScreen.classList.remove("is-logroom");
        showStoryPage(0);
        // ECHOを開いた直後からEnterキーで本文を操作できるようにします。
        storyPanel.focus({ preventScroll: true });
      });
    } else {
      document.getElementById("popup-message").textContent = "AUTHORIZATION PENDING.";
      document.getElementById("system-popup").showModal();
    }
  });
});
openChapterFiveButton.addEventListener("click", () => {
  if (openChapterFiveButton.disabled) return;
  isLogroomStory = false;
  activeStoryPages = rewindStoryPages;
  transitionScreens(hideoutScreen, echoScreen, () => {
    document.getElementById("story-hideout").textContent = "Hideoutに戻る";
    echoScreen.classList.remove("is-logroom");
    showStoryPage(0);
    storyPanel.focus({ preventScroll: true });
  });
});

document.getElementById("popup-close").addEventListener("click", () => {
  document.getElementById("system-popup").close();
});

document.getElementById("home-button").addEventListener("click", () => {
  transitionScreens(hideoutScreen, titleScreen);
});

// Hideout各章は、1画面あたり最大3行で本文を分けています。
const echoStoryPages = [
  "少女は、ベッドに横になっていた。\n身体が重い。けだるさを感じながらも、\nゆっくりと身体を起こす。",
  "起き上がった少女はつぶやく。「ここは、何…？」\n目に飛び込んできたのは、窓の外の景色。\nしかし、窓の向こうには一面の紫の空が広がっていた。",
  "その一部は、不規則に明滅している。\nまるで壊れたテレビの画面のように、\nノイズが景色全体に広がっている。",
  "さながら、異世界のようだ。\n部屋の中に目を向ける。\n部屋の中には、外の景色のような異常は見当たらない。",
  "「…なんで、ここだけ普通なの？」\n部屋の片隅にはデスクがあり、3つのモニター、\nそしてデスクトップPCが置かれている。",
  "まるでゲーマーや配信者の部屋のようだ。\nふと、ここに来る前のことを思い出そうとする。\nしかし脳に鍵がかかったように、",
  "何一つ思い出すことができない。\nここに来るまでの記憶はおろか、\n幼少期の記憶すら思い出せない。",
  "「どうして、思い出せないの…！」\n焦燥にかられながらも、少女は、部屋を見渡した。\n部屋にはバッグが無造作に置かれ、妙に生活感がある。",
  "見覚えはないはずなのに、どこか懐かしい。\nもしかすると、私はこの部屋で暮らしていたのかもしれない。",
  "だとすれば、ここに私のことを知る手掛かりがあるはずだ。\n少女は、自分が何者なのかを知るため、部屋を調べ始めた。"
];
const connectStoryPages = [
  "「……うーん。手掛かり、ないなぁ。」\n部屋中を探し回ったものの、\n手掛かりらしいものは見つからなかった。",
  "机の引き出しには文房具や小物が並び、\n本棚には参考書が山のように積まれている。\n少なくとも、この部屋の主は高校生らしい。",
  "しかし、それ以上のことは何も分からなかった。\n諦めかけたそのとき。\nピロン、と電子音が響いた。",
  "音のする方へ目を向ける。どうやら、\n床に置かれたバッグの中から聞こえてきたようだ。\n中を覗くと、一台のスマートフォンがあった。",
  "手に取った瞬間、\nケースに差し込まれた一枚のカードが目に入る。\n学生証だった。",
  "「……青山、雷華？」\n顔写真と名前を見ても、何も思い出せない。\nバッグの中にあった鏡を取り出し、",
  "写真と自分の顔を見比べる。\n間違いない。そこに写っているのは、自分だった。\n「……これが、私の名前？」",
  "少女はもう一度、スマートフォンに目を落とした。\n画面には、SNSのタイムラインが表示されている。\n「……らいかのさぶ？」",
  "見覚えのないアカウントだった。\nしかし、そこには友人とのやり取りや、ゲームの話、\n学校での出来事など、何気ない日常が数多く投稿されていた。",
  "最初は、まるで他人の日記を読んでいるようだった。\nけれど、画面をスクロールするうちに、\n少しずつ見覚えのある光景が浮かんでくる。",
  "放課後、友人たちと寄り道して食事をしたこと。\nくだらない話で笑い合ったこと。\n教室で過ごした、何でもない時間。",
  "「……あ。」\n覚えている。\nほんの少しずつだけど、確かに。",
  "少女は夢中になって、投稿を遡った。\nやがて、ゲームに関する投稿が目に留まる。\nそこには、あるFPS大会の話題があった。",
  "画面を見た瞬間、一人の人物が思い浮かぶ。\n兄だった。\nかつて、兄がFPSの大会に出場したことがあった。",
  "画面の中で華麗に敵を倒し、仲間と喜び合う姿。\nその光景は、いつしか雷華の憧れになっていた。\n自分も、あんなふうにゲームを楽しみたい。",
  "そう思うようになったのだ。\nさらに投稿を遡ると、今度は配信に関する記録が現れた。\n好きな配信者に影響され、自分でも配信を始めたこと。",
  "決してプレイスキルが高いわけではなかったけれど、\n楽しくゲームをする姿を見て、\n誰かが笑ってくれるのが嬉しかった。",
  "配信を始めて半年が経った頃には、\nフォロワーが3000人を超えていた。\n画面の向こうから届く「楽しかった」の一言が、",
  "何より嬉しかった。\n「……私、配信なんてしてたんだ。」\n思わず笑みがこぼれる。",
  "友達と過ごした日々も、ゲームに夢中になった時間も。\nどれも、確かに自分が生きてきた証だった。\nけれど、ある投稿を見つけた瞬間、その手が止まった。",
  "『なんか最近彼氏元気ないんよな\n私にできることあるんかな～～』\n「……彼氏？」",
  "その言葉を口にした瞬間、脳裏にある光景が蘇った。\n隣に座ってゲームをする少年。\n楽しそうに笑う顔。",
  "その姿は、どこか兄に似ていた。\nそして、いつかプロゲーマーになりたいと語っていた声。\n「ナイス！ 今の連携よくなかった！？」",
  "「うん、いい感じだったね」\n「でしょー！ また一緒にやろ！！」\n彼が楽しそうに笑ってくれる。それだけで、",
  "私まで嬉しくなった。\n「……そうだ。私、この人のこと……」\n胸の奥に、温かいものが広がる。",
  "彼と過ごした日々が、少しずつ蘇ってくる。\n一緒にゲームをしたこと。\n何気ないことで笑い合ったこと。",
  "楽しかった記憶ばかりだった。\n……そのはずだった。\n雷華は、もう一度投稿を読み返した。",
  "『なんか最近彼氏元気ないんよな』\nその言葉が、妙に引っかかる。\nそして、別の記憶が蘇った。",
  "「親に話したけど、ダメだった」\n俯いたまま話す彼に、雷華は笑顔で答えた。\n「きっと説得し続ければ何とかなるよ！ 私も、",
  "あなたがプロゲーマーとして活躍するところ見たいもん！」\n彼には、いつだって笑っていてほしかった。\nけれど、彼は笑わなかった。",
  "それから、二人が話す機会は少しずつ減っていった。\n「……あのとき、彼は何を考えていたんだろう。」\n画面には、あの日の自分の言葉が残っている。",
  "『私にできることあるんかな～～』\n何度読み返しても、その答えは書かれていなかった。\nそのとき。",
  "脳裏に、別の光景がよぎった。\n彼の部屋。\n閉ざされた扉。",
  "「……っ！」\n雷華は思わず目を閉じた。\n何か、大切なことを忘れている。",
  "それはきっと――\n忘れてはいけないことだった。"
];
const memoryStoryPages = [
  "あの日、私は彼の部屋を訪ねた。\n最近は一緒にゲームをすることもなく、\n連絡すらほとんど取れていなかった。",
  "もう一度、ちゃんと話がしたい。\nそう思って連絡すると、彼から部屋に来るよう返事があった。\n久しぶりに会えることが、少し嬉しかった。",
  "けれど、部屋に入った瞬間、その気持ちは消え去った。\n彼は、俯いたまま座っていた。\n声をかけようとして、ふと手元に目が留まる。",
  "――ナイフを、握っていた。\n「……なんで？」\n思わず声が漏れた。",
  "彼は、こちらを見ようともせず、ぽつりと話し始めた。\n「何度も話したんだよ。ゲームを仕事にしたいって。」\n「でも、全然聞いてくれなかった。」",
  "「僕の人生なのに……どうして、\n僕が決めちゃいけないんだろう。」\n彼の声は、今にも消えてしまいそうだった。",
  "「……もう、疲れた。」\n「ここには、僕の居場所なんてないんだ。」\n「そんなことない！！」",
  "私は思わず叫んだ。\n「私がいるじゃん！！」\n「私が一緒に考えるから！ だから、",
  "そんなこと言わないでよ……！」\n彼は、小さく首を横に振った。\n「雷華は、頑張れば何とかなるって言ってくれたよね。」",
  "「……うん。」\n「でも、僕はもう、どう頑張ればいいのか分からないんだ。」\n何も言い返せなかった。",
  "彼を励ましたかった。\nただ、また笑ってほしかった。\nなのに、何を言えばいいのか分からなかった。",
  "言葉を探しているうちに、彼の手が動いた。\n握られた刃が、ゆっくりと首元へ向かう。\n「待って！ やめて！」",
  "止めなきゃ。\n私は咄嗟に彼の手を掴んだ。\n振り払おうとする彼。",
  "もつれ合った、その一瞬。\n鋭い刃が、彼の首元を裂いた。\n鮮やかな赤が溢れていく。",
  "「……え？」\n彼はその場に崩れ落ちた。\n「ねえ……？」",
  "返事はない。\n「ねえ、起きてよ……！」\n何度呼びかけても、彼は動かなかった。",
  "まって。\nどうして。\nもういやだ。",
  "おいていかないで。\nかれがいないと。\nわたしは。",
  "「×××××××××××××」\nふと、赤く染まったナイフが目に入った。",
  "「これで、おそろいだね。」\n――そこで、記憶は途切れた。"
];
const crossroadStoryPages = [
  "「……あ」\n気がつくと、見覚えのある部屋に立っていた。\n思い出した。",
  "全部。\n彼が死んだことも。\n私が、その後を追ったことも。",
  "「……なんで、忘れてたんだろ。」\n自分が死んでいることよりも、彼のことを忘れていた事実が、\n何より恐ろしかった。",
  "「……私の、せいだ。」\n私は、何をしていた？\nあのとき、もっと彼の言葉を受け止めていれば。",
  "彼の苦しみに、もっと早く気づいていれば。\nそもそも、彼と出会わなければ。\nそんな考えばかりが、頭の中を巡っていた。",
  "けれど、どれだけ考えても、彼は帰ってこない。\n「……ごめん。」\n小さく呟いた言葉は、誰にも届かなかった。",
  "部屋を見渡す。\n見慣れた机。並んだモニター。ゲームのために揃えた機材。\nどれも、かつての私が大切にしていたものだった。",
  "彼とゲームをして、何気ないことで笑い合った日々。\n温かかった思い出が、今は胸を締め付ける。\nこの異質な世界に一人取り残され、",
  "過去への未練に囚われている。\n……まるで、幽霊みたいだ。\nもう、考えたくなかった。",
  "彼のことも。\nあの日のことも。\n全部、忘れてしまいたい。",
  "でも。\n彼と過ごした日々まで、忘れてしまうのだろうか。\n一緒に笑ったことも。",
  "楽しかった時間も。\nそれだけは、嫌だった。\n忘れたい。",
  "でも、忘れたくない。\n何度考えても、答えは出なかった。",
  "ただ、今はもう、この苦しみに耐えられなかった。\n「全部、忘れられたらいいのに……」"
];
const rewindStoryPages = [
  "気がつくと、雷華は見知らぬ場所に立っていた。\n「……え？」\n見渡す限り、白。",
  "空も、水平線も、どこまでも白く染まっている。\n足元には、静かな水面が広がっていた。\n一歩踏み出すと、波紋がゆっくりと遠ざかっていく。",
  "「……ここ、どこ？」\n振り返っても、そこに自分の部屋はなかった。\nただ、果てしない白い海が広がっている。",
  "私は当てもなく歩き始めた。\nしかし、どれだけ歩いても景色は変わらなかった。\nやがて足を止め、ぽつりと呟く。",
  "「……もう、疲れた。」\nその言葉は、静かな水面に吸い込まれていった。\nふと、先ほど口にした願いが頭をよぎる。",
  "「全部、忘れられたら……。」\n彼と過ごした楽しい日々。\n辛かったこと。",
  "そして、あの日のこと。\nすべて。\n水面に映る自分の顔を見つめる。",
  "「……私、どうしたいんだろう。」\n忘れてしまいたい。\nでも、彼と過ごした時間まで失いたくはない。",
  "何度考えても、答えは出なかった。\nただ、もう苦しみたくなかった。\n雷華は、しばらく水面を見つめていた。",
  "やがて、静かに目を伏せる。\nもう、何も考えたくない。\nすべてをしまって、眠ろう。",
  "「……もういいや。」\nそう呟き、私は目を閉じた。\n彼の顔が、少しずつ思い出せなくなる。",
  "一緒に笑った声も、遠ざかっていく。\n楽しかった日々も、苦しかった記憶も。\nやがて、自分が何を忘れようとしていたのかさえ、",
  "分からなくなった。\n――\n少女は、ベッドに横になっていた。",
  "身体が重い。けだるさを感じながらも、\nゆっくりと身体を起こす。",
  "起き上がった少女はつぶやく。「ここは、何…？」\n――また、繰り返す。"
];
const logroomSceneLogPages = [
  "少女は、ゆっくりと身体を起こす。",
  "ここは、どこだろう。",
  "自分は、誰だっただろう。",
  "机の上には、見覚えのないものが並んでいる。",
  "窓の外には、何も見えない。",
  "少女は、部屋を見渡した。",
  "何か、大切なものを忘れている気がする。",
  "けれど、それが何なのかは分からなかった。",
  "部屋にはバッグの中身を出した跡があり、散らかっている。",
  "散らかった部屋に嫌悪を抱きつつ、この部屋で暮らしていたのかもしれないと考える。",
  "ならば、私のことを知る手掛かりがあるはずだ。",
  "少女は、部屋を調べ始めた。"
];
const logroomCharacterPages = [
  "雷華の目の前には手帳型のスマホがある。画面が割れている。",
  "不思議そうにスマホを覗くと、SNSアカウントが表示された。",
  "さかのぼると、スマホを新調した日の投稿を見つける。絶対割らないから！と豪語している。",
  "「……結局、割っちゃってるじゃん。」",
  "少し笑ってから、ふと考える。",
  "「……でも、いつ割ったんだろう。」",
  "その他、ゲームや配信で盛り上がった日のこと。大切な人と過ごした日々を投稿から思い出す。",
  "「…でも。」\n「ほんとうに、それだけだったかな。」",
  "雷華は、もう一度投稿を読み返した。",
  "そこに書かれていない何かを、思い出せる気がした。"
];
const logroomWorldDataPages = [
  "ちゃんと話し合おうと思った。\n前見たいに笑い合いたかったから。",
  "でも、それは叶わなかった。",
  "彼は、自ら命を絶とうとしていた。",
  "それだけはダメだと思った。\n身体が咄嗟に動いた。",
  "けれど、私は彼を救えなかった。",
  "「…私のせいだ。」",
  "まって。",
  "どうして。",
  "もういやだ。",
  "おいていかないで。",
  "かれがいないと。",
  "わたしは。",
  "「わたしをしあわせにできない」",
  "彼女の視線は、自然と赤で染まったナイフに伸びていた。",
  "もう動かない彼に向けて、私は自嘲気味に呟く。",
  "思い出した。",
  "彼が死んだことも。\n私が、その後を追ったことも。",
  "けれど、今はそれ以上に、あのときの自分の言葉が頭から離れなかった。",
  "「わたしをしあわせにできない」",
  "私は、どうしてそんなことを思ったんだろう。",
  "彼と過ごした日々が、次々と思い浮かぶ。",
  "楽しかったはずの記憶が、今はひどく苦しい。",
  "「……全部、忘れられたらいいのに。」"
];
const logroomExtraPages = [
  "「全部、忘れられたらいいのに…」",
  "もう、全て忘れたい。",
  "気付いてしまった。自身の奥深くにある醜いそれに。",
  "つまるところ、私は、彼を利用していた。",
  "彼と一緒にいることが私の幸せだと、そう信じて疑わなかった。",
  "でもそれは、私が選んだものではなく、ただ寄りかかっていただけだった。",
  "彼が苦悩する前から、ずっと私はこうだった。",
  "「私が、彼を殺したんだ。」",
  "彼にかけた言葉全てが、彼を傷つける刃のように感じてしまう。",
  "こんな醜い自分が存在していることが許せない。",
  "私は、こんな私を消したい。",
  "彼にできる償いは、これしか残されていないと思った。"
];
const logroomAnswerStoryText = `気がつくと、私は見知らぬ場所に立っていた。

見渡す限り、白。

空も、水平線も、どこまでも白く染まっている。

足元には、静かな水面が広がっていた。

「……ここは……？」

水面に映る自分の顔を見つめる。

彼を救えなかった。
彼の苦しみを、ちゃんと理解することもできなかった。
それなのに、自分の幸せを彼に預けていた。

そんな自分が、今も許せない。

「……もう、消えてしまいたい。」

目を閉じれば、何もかも終わるような気がした。

彼との思い出も。

あの日の後悔も。

そして、私自身も。

全部、消えてしまえば。

もう、苦しまなくて済むのかもしれない。

そう思った。

……なのに。

目を閉じることができなかった。

「……なんで。」

何をためらっているんだろう。

こんな自分、もう嫌なのに。

ふと、日記に書かれていた言葉が頭をよぎる。

あの日、ゲームカフェでさくやくんに出会ったこと。

思い切って声をかけたこと。

放課後に呼び出して、大きな声で告白したこと。

……なんて、恥ずかしいことをしていたんだろう。

少しだけ、笑みがこぼれた。

あのとき、私は自分で選んでいた。

ゲームが好きだった。

もっと上手くなりたかった。

さくやくんと、一緒にいたかった。

彼を好きになったことも。

彼と過ごした時間が幸せだったことも。

それだけは、嘘じゃない。

……そう、思いたかった。

でも、あの日のことは消えない。

私は、彼の苦しみに気づいてあげられなかった。

支えたいと言いながら、自分の願いばかり押しつけていたのかもしれない。

そして、彼がいなくなった瞬間、自分自身の幸せまで失ってしまった。

「……こんな私が、幸せになってもいいのかな。」

答えてくれる人はいなかった。

いくら考えても、分からない。

自分を許していいのか。

彼との思い出を、幸せだったと言っていいのか。

これから、どうすればいいのか。

何一つ、答えは出なかった。

「……もう、疲れた。」

ぽつりと呟く。

もう、考えるのをやめてしまいたい。

全部忘れて、何も知らない自分に戻れたら。

……でも。

それでは、また同じことを繰り返すだけなんじゃないだろうか。

彼がいなければ、自分を幸せにできない。

そう思い込んで、「おそろい」を選んでしまった、あのときのように。

自分が嫌だから、自分を消してしまう。

それは、本当に私が望んでいることなんだろうか。

「……私、どうしたいんだろう。」

水面に映る自分に問いかける。

やっぱり、答えは出なかった。

彼を失った悲しみは、消えない。

自分のしたことも、簡単には許せない。

きっと、これからも悩み続けるんだと思う。

それでも。

今、すべてを終わらせてしまったら。

もう、その答えを探すことさえできなくなる。

彼を救えなかったことも。

私がしてしまったことも。

なかったことにはしたくない。

彼と過ごした日々も、忘れたくない。

だから、もう少しだけ。

覚えていたい。

「おぼえていく」ことで、これからも向き合っていきたい。

自分を許せる日が来るのかは、分からない。

幸せになっていいのかも、まだ分からない。

でも。

だからといって、これからの私まで諦めなくてもいいのかもしれない。

「……だからもう、『おそろい』は、やめるね。」

もう会えない彼に向けて、そう呟いた。

笑おうとした。

けれど、うまく笑えなかった。

足元に、小さな波紋が広がる。

やがて、白い景色がゆっくりと薄れていった。

――

気がつくと、見慣れた部屋に戻っていた。

机に並んだモニター。

ゲームのために揃えた機材。

この部屋で、友達と笑い合ったこと。

さくやくんと一緒に遊んだこと。

たくさんの記憶が蘇ってくる。

「……懐かしいな。」

ふと、パソコンのモニターに目を向ける。

少し迷ってから、当時よく遊んでいたFPSゲームを起動した。

どういう理屈かは分からないけれど、以前のデータが残っていた。

フレンド一覧には、見慣れた名前が並んでいる。

もちろん、さくやくんの名前も。

「……っ。」

胸が締め付けられた。

思わず、画面から目を逸らす。

まだ、辛い。

彼の名前を見るだけで、こんなにも苦しい。

本当に、これでよかったんだろうか。

……分からない。

それでも、もう一度画面に目を向けた。

ゲームが好きだった。

誰かと一緒に遊ぶのも、楽しかった。

でも、それだけじゃない。

もっと上手くなりたいと思ったことも。

夢中になって時間を忘れたことも。

全部、私自身が感じた楽しさだった。

今だって、きっと。

……いや。

まだ、分からないけど。

少しだけ、遊んでみようかな。

誰かに喜んでもらうためでも、誰かに必要とされるためでもなく。

ただ、私がやりたいから。

私が、私自身を楽しませるために。

それが、今の私に出せる、精いっぱいの答えなんだと思う。

そっと、マウスに手を伸ばした。

そして自分を奮い立たせるように、声を出す。

「……さあ、楽しもう。」

声は震えていた。

でも、今この瞬間を楽しもう。

時間が惜しいと感じる、その時まで。`;
const logroomAnswerPages = paginateStoryText(logroomAnswerStoryText);
const hideoutStoryPageArrays = {
  echo: echoStoryPages,
  connect: connectStoryPages,
  memory: memoryStoryPages,
  crossroad: crossroadStoryPages,
  rewind: rewindStoryPages
};
const logroomStoryPageArrays = {
  logroomSceneLog: logroomSceneLogPages,
  logroomCharacter: logroomCharacterPages,
  logroomWorldData: logroomWorldDataPages,
  logroomExtra: logroomExtraPages,
  logroomAnswer: logroomAnswerPages
};
const storyPageArrays = { ...hideoutStoryPageArrays, ...logroomStoryPageArrays };
const storyPageDefaults = Object.fromEntries(
  Object.entries(storyPageArrays).map(([key, pages]) => [key, [...pages]])
);
const hideoutStoryPageStorageKey = "raika-hideout-story-page-overrides-v1";
const storyTextStyleStorageKey = "raika-story-text-styles-v1";
const fixedRedStoryPhrases = { logroomWorldData: ["「わたしをしあわせにできない」"] };
function readStoryTextStyleOverrides() {
  try {
    const value = JSON.parse(localStorage.getItem(storyTextStyleStorageKey) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}
function readHideoutStoryPageOverrides() {
  try {
    const value = JSON.parse(localStorage.getItem(hideoutStoryPageStorageKey) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}
function loadHideoutStoryPageOverrides() {
  const overrides = readHideoutStoryPageOverrides();
  for (const [key, pages] of Object.entries(overrides)) {
    const target = storyPageArrays[key];
    if (target && Array.isArray(pages) && pages.length && pages.every(page => typeof page === "string" && page.trim())) {
      target.splice(0, target.length, ...pages);
    }
  }
}
loadHideoutStoryPageOverrides();
let isLogroomStory = false;
let logroomStoryNumber = 1;
let activeStoryPages = echoStoryPages;
let currentStoryPage = 0;
const storyPanel = document.getElementById("story-panel");
const storyAutoButton = document.getElementById("story-auto");
const storyEditor = document.getElementById("story-editor");
const storyEditorContent = document.getElementById("story-editor-content");
const storyEditorCount = document.getElementById("story-editor-count");
const storyEditorChapter = document.getElementById("story-editor-chapter");
const storyEditorAuth = document.getElementById("story-editor-auth");
const storyEditorAuthForm = document.getElementById("story-editor-auth-form");
const storyEditorPassword = document.getElementById("story-editor-password");
const storyEditorAuthError = document.getElementById("story-editor-auth-error");
const storyEditorColorStatus = document.getElementById("story-editor-color-status");
const storyEditorColorList = document.getElementById("story-editor-color-list");
let workingStoryTextStyles = [];
const storyPageBreakMarker = "--- PAGE BREAK ---";
function countStoryPhraseOccurrences(value, phrase) {
  let count = 0;
  let offset = 0;
  while ((offset = value.indexOf(phrase, offset)) !== -1) {
    count += 1;
    offset += phrase.length;
  }
  return count;
}
function getEditorProtectedPhrases() {
  const chapterKey = storyEditor.dataset.chapterKey;
  return [...new Set([...(fixedRedStoryPhrases[chapterKey] || []), ...workingStoryTextStyles.map(style => style.text)])];
}
function protectedStoryPhrasesAreIntact(original, edited) {
  const fixedPhrasesIntact = getEditorProtectedPhrases().every(phrase =>
    countStoryPhraseOccurrences(edited, phrase) >= countStoryPhraseOccurrences(original, phrase));
  const orangeStylesPresent = workingStoryTextStyles.every(style =>
    countStoryPhraseOccurrences(edited, style.text) > style.occurrence);
  return fixedPhrasesIntact && orangeStylesPresent;
}
function storyEditTouchesProtectedPhrase(value, start, end, isInsertion) {
  return getEditorProtectedPhrases().some(phrase => {
    let offset = 0;
    while ((offset = value.indexOf(phrase, offset)) !== -1) {
      const phraseEnd = offset + phrase.length;
      if (start < phraseEnd && end > offset) return true;
      if (isInsertion && start === end && start > offset && start < phraseEnd) return true;
      offset = phraseEnd;
    }
    return false;
  });
}
function getActiveStoryEditKey() {
  return Object.entries(storyPageArrays).find(([, pages]) => pages === activeStoryPages)?.[0] || null;
}
function getStoryTextStyleAnnotations(chapterKey) {
  const pages = storyPageArrays[chapterKey] || [];
  const storyText = pages.join("\n");
  const fixedStyles = (fixedRedStoryPhrases[chapterKey] || []).flatMap(text =>
    Array.from({ length: countStoryPhraseOccurrences(storyText, text) }, (_, occurrence) => ({ text, color: "red", occurrence })));
  const savedStyles = readStoryTextStyleOverrides()[chapterKey];
  const orangeStyles = Array.isArray(savedStyles) ? savedStyles.filter(style =>
    style && typeof style.text === "string" && style.text && style.color === "orange"
      && Number.isInteger(style.occurrence) && style.occurrence >= 0) : [];
  return [...fixedStyles, ...orangeStyles];
}
function getStoryTextRanges(pageText, pageIndex) {
  const chapterKey = getActiveStoryEditKey();
  if (!chapterKey) return [];
  const pagesBefore = activeStoryPages.slice(0, pageIndex).join("\n");
  const ranges = [];
  for (const style of getStoryTextStyleAnnotations(chapterKey)) {
    let targetOccurrence = style.occurrence - countStoryPhraseOccurrences(pagesBefore, style.text);
    if (targetOccurrence < 0) continue;
    let offset = -1;
    let searchFrom = 0;
    while (targetOccurrence >= 0) {
      offset = pageText.indexOf(style.text, searchFrom);
      if (offset === -1) break;
      targetOccurrence -= 1;
      searchFrom = offset + style.text.length;
    }
    if (offset === -1 || targetOccurrence >= 0) continue;
    const start = Array.from(pageText.slice(0, offset)).length;
    ranges.push({ start, end: start + Array.from(style.text).length, color: style.color });
  }
  return ranges.sort((left, right) => left.start - right.start);
}
function renderStyledStoryText(pageText, visibleCount, pageIndex, ranges = getStoryTextRanges(pageText, pageIndex)) {
  const storyText = document.getElementById("story-text");
  const characters = Array.from(pageText);
  const count = Math.min(visibleCount, characters.length);
  const fragment = document.createDocumentFragment();
  let index = 0;
  while (index < count) {
    const activeRange = ranges.find(range => index >= range.start && index < range.end);
    const nextRange = ranges.find(range => range.start > index);
    const end = activeRange ? Math.min(count, activeRange.end) : Math.min(count, nextRange?.start ?? count);
    const text = characters.slice(index, end).join("");
    if (activeRange) {
      const span = document.createElement("span");
      span.className = activeRange.color === "red" ? "story-inline-red" : "story-inline-orange";
      span.textContent = text;
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(text));
    }
    index = end;
  }
  storyText.replaceChildren(fragment);
}
function serializeStoryPages(pages) {
  return pages.join(`\n\n${storyPageBreakMarker}\n\n`);
}
function parseStoryPages(value) {
  return value.split(new RegExp(`\\r?\\n${storyPageBreakMarker}\\r?\\n`))
    .map(page => page.trim().replace(/\n{2,}/g, "\n"))
    .filter(Boolean);
}
function getStoryLineWidth() {
  const designWidth = Math.min(window.innerWidth, window.innerHeight * (1672 / 941));
  return designWidth * 0.956 * 0.76;
}
function wrapStoryTextToLines(pageText) {
  const storyText = document.getElementById("story-text");
  const style = window.getComputedStyle(storyText);
  const fontSize = Number.parseFloat(style.fontSize) || 30;
  const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  const maxWidth = getStoryLineWidth();
  const measure = (character) => context.measureText(character).width + letterSpacing;
  const normalized = pageText.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    .reduce((joined, line) => {
      if (!joined) return line;
      const needsSpace = /[A-Za-z0-9]$/.test(joined) && /^[A-Za-z0-9]/.test(line);
      return `${joined}${needsSpace ? " " : ""}${line}`;
    }, "");
  const characters = Array.from(normalized);
  const lines = [];
  let start = 0;
  while (start < characters.length) {
    let end = start;
    let width = 0;
    while (end < characters.length) {
      const nextWidth = measure(characters[end]);
      if (end > start && width + nextWidth > maxWidth) break;
      width += nextWidth;
      end += 1;
    }
    if (end === start) end += 1;
    if (end < characters.length) {
      const minBreak = start + Math.floor((end - start) * 0.65);
      for (let index = end - 1; index >= minBreak; index -= 1) {
        if (/[、。，．！？!?：；…」』）】]$/.test(characters[index])) {
          end = index + 1;
          break;
        }
      }
    }
    lines.push(characters.slice(start, end).join("").trim());
    start = end;
    while (characters[start] === " ") start += 1;
  }
  return lines.filter(Boolean);
}
function paginateStoryText(text) {
  const lines = text.split(/\n\s*\n/).flatMap(paragraph => wrapStoryTextToLines(paragraph));
  const pages = [];
  for (let index = 0; index < lines.length; index += 3) {
    pages.push(lines.slice(index, index + 3).join("\n"));
  }
  return pages;
}
function autoSplitStoryPages() {
  const sourcePages = parseStoryPages(storyEditorContent.value);
  if (!sourcePages.length) {
    window.alert("先にシナリオ本文を貼り付けてください。");
    return;
  }
  const pages = sourcePages.flatMap(sourcePage => {
    const lines = wrapStoryTextToLines(sourcePage);
    const wrappedPages = [];
    for (let index = 0; index < lines.length; index += 3) {
      wrappedPages.push(lines.slice(index, index + 3).join("\n"));
    }
    return wrappedPages;
  });
  storyEditorContent.value = serializeStoryPages(pages);
  storyEditor.dataset.resetToDefault = "false";
  storyEditor.dataset.saveStatus = "";
  updateStoryEditorCount();
}
function updateStoryEditorCount() {
  const pageCount = parseStoryPages(storyEditorContent.value).length;
  const savedStatus = storyEditor.dataset.saveStatus === "saved" ? " ・ 保存しました" : "";
  storyEditorCount.textContent = `${pageCount}ページに分かれています${savedStatus}`;
}
function markStoryEditorFormattingChanged() {
  storyEditor.dataset.resetToDefault = "false";
  storyEditor.dataset.saveStatus = "";
}
function renderStoryEditorColorList() {
  storyEditorColorList.replaceChildren();
  if (!workingStoryTextStyles.length) {
    storyEditorColorStatus.textContent = "文字を選択して指定してください。";
    return;
  }
  workingStoryTextStyles.forEach((style, index) => {
    const chip = document.createElement("div");
    chip.className = "story-editor-color-chip";
    const label = document.createElement("span");
    label.textContent = "オレンジ: " + style.text;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "解除";
    remove.setAttribute("aria-label", "「" + style.text + "」のオレンジ指定を解除");
    remove.addEventListener("click", () => {
      workingStoryTextStyles.splice(index, 1);
      markStoryEditorFormattingChanged();
      renderStoryEditorColorList();
      storyEditorColorStatus.textContent = "色指定を解除しました。本文を編集できます。";
    });
    chip.append(label, remove);
    storyEditorColorList.appendChild(chip);
  });
  storyEditorColorStatus.textContent = "オレンジ指定の文言は本文編集時にロックされます。";
}
function applyOrangeStoryTextStyle() {
  const start = storyEditorContent.selectionStart;
  const end = storyEditorContent.selectionEnd;
  const selectedText = storyEditorContent.value.slice(start, end);
  if (!selectedText) {
    storyEditorColorStatus.textContent = "先にオレンジ色にする文言を選択してください。";
    return;
  }
  if (/[\r\n]/.test(selectedText) || selectedText.includes(storyPageBreakMarker)) {
    storyEditorColorStatus.textContent = "ページ区切りをまたがず、1行の文言を選択してください。";
    return;
  }
  if (storyEditTouchesProtectedPhrase(storyEditorContent.value, start, end, false)) {
    storyEditorColorStatus.textContent = "色付き指定済みの文言は変更できません。解除してから指定してください。";
    return;
  }
  const occurrence = countStoryPhraseOccurrences(storyEditorContent.value.slice(0, start), selectedText);
  workingStoryTextStyles.push({ text: selectedText, color: "orange", occurrence });
  markStoryEditorFormattingChanged();
  renderStoryEditorColorList();
  storyEditorColorStatus.textContent = "「" + selectedText + "」をオレンジ指定しました。保存して反映してください。";
}
function loadStoryEditorChapter(chapterKey) {
  const pages = storyPageArrays[chapterKey];
  if (!pages) return;
  const isLogroomChapter = chapterKey.startsWith("logroom");
  const chapterNumber = Object.keys(isLogroomChapter ? logroomStoryPageArrays : hideoutStoryPageArrays).indexOf(chapterKey) + 1;
  storyEditor.dataset.chapterKey = chapterKey;
  storyEditor.dataset.resetToDefault = "false";
  storyEditor.dataset.saveStatus = "";
  storyEditor.dataset.initialValue = serializeStoryPages(pages);
  const savedStyles = readStoryTextStyleOverrides()[chapterKey];
  workingStoryTextStyles = Array.isArray(savedStyles) ? savedStyles.filter(style =>
    style && typeof style.text === "string" && style.text && style.color === "orange"
      && Number.isInteger(style.occurrence) && style.occurrence >= 0).map(style => ({ ...style })) : [];
  storyEditor.dataset.initialStyles = JSON.stringify(workingStoryTextStyles);
  const chapterTitle = chapterKey === "logroomAnswer" ? "Logroom #5-A Answer / VOLTA"
    : `${isLogroomChapter ? "Logroom" : "Hideout"} #${chapterNumber}`;
  document.getElementById("story-editor-title").textContent = `${chapterTitle} の区切りを調整`;
  storyEditorContent.value = storyEditor.dataset.initialValue;
  renderStoryEditorColorList();
  updateStoryEditorCount();
}
function closeStoryEditor() {
  if (!storyEditor.open) return;
  const hasUnsavedChanges = storyEditorContent.value !== storyEditor.dataset.initialValue
    || JSON.stringify(workingStoryTextStyles) !== storyEditor.dataset.initialStyles;
  if (hasUnsavedChanges && !window.confirm("保存していない変更があります。編集を終了しますか？")) return;
  storyEditor.close();
}
function saveStoryEditor() {
  const chapterKey = storyEditor.dataset.chapterKey;
  const targetPages = storyPageArrays[chapterKey];
  if (!protectedStoryPhrasesAreIntact(storyEditor.dataset.initialValue || "", storyEditorContent.value)) {
    storyEditorCount.textContent = "色付き指定文言は変更できません。元の文言に戻してください。";
    return;
  }
  const pages = parseStoryPages(storyEditorContent.value);
  if (!targetPages || !pages.length) {
    window.alert("本文が空です。ページ区切りを確認してください。");
    return;
  }
  const overrides = readHideoutStoryPageOverrides();
  const styleOverrides = readStoryTextStyleOverrides();
  if (storyEditor.dataset.resetToDefault === "true") {
    delete overrides[chapterKey];
    delete styleOverrides[chapterKey];
  } else {
    overrides[chapterKey] = pages;
    if (workingStoryTextStyles.length) styleOverrides[chapterKey] = workingStoryTextStyles;
    else delete styleOverrides[chapterKey];
  }
  try {
    localStorage.setItem(hideoutStoryPageStorageKey, JSON.stringify(overrides));
    localStorage.setItem(storyTextStyleStorageKey, JSON.stringify(styleOverrides));
  } catch {
    window.alert("このブラウザーに保存できませんでした。");
    return;
  }
  targetPages.splice(0, targetPages.length, ...pages);
  storyEditor.dataset.initialValue = serializeStoryPages(pages);
  storyEditor.dataset.initialStyles = JSON.stringify(workingStoryTextStyles);
  storyEditor.dataset.resetToDefault = "false";
  storyEditor.dataset.saveStatus = "saved";
  updateStoryEditorCount();
  const shouldRefreshCurrentStory = activeStoryPages === targetPages && !echoScreen.hidden;
  if (shouldRefreshCurrentStory) showStoryPage(Math.min(currentStoryPage, targetPages.length - 1));
}
storyEditorContent.addEventListener("input", () => {
  storyEditor.dataset.resetToDefault = "false";
  storyEditor.dataset.saveStatus = "";
  updateStoryEditorCount();
});
document.getElementById("story-editor-color-orange").addEventListener("click", applyOrangeStoryTextStyle);
storyEditorContent.addEventListener("beforeinput", event => {
  const value = storyEditorContent.value;
  let start = storyEditorContent.selectionStart;
  let end = storyEditorContent.selectionEnd;
  if (start === end && event.inputType === "deleteContentBackward") start = Math.max(0, start - 1);
  else if (start === end && event.inputType === "deleteContentForward") end = Math.min(value.length, end + 1);
  const isInsertion = event.inputType.startsWith("insert");
  if (!storyEditTouchesProtectedPhrase(value, start, end, isInsertion)) return;
  event.preventDefault();
  storyEditorCount.textContent = "色付き指定文言は編集できません。";
});
storyEditorChapter.addEventListener("change", () => {
  const currentKey = storyEditor.dataset.chapterKey;
  const hasUnsavedChanges = storyEditorContent.value !== storyEditor.dataset.initialValue
    || JSON.stringify(workingStoryTextStyles) !== storyEditor.dataset.initialStyles;
  if (hasUnsavedChanges && !window.confirm("保存していない変更は破棄されます。別の章を開きますか？")) {
    storyEditorChapter.value = currentKey;
    return;
  }
  loadStoryEditorChapter(storyEditorChapter.value);
});
document.getElementById("story-editor-close").addEventListener("click", closeStoryEditor);
document.getElementById("story-editor-close-bottom").addEventListener("click", closeStoryEditor);
document.getElementById("story-editor-save").addEventListener("click", saveStoryEditor);
document.getElementById("story-editor-auto-wrap").addEventListener("click", autoSplitStoryPages);
document.getElementById("story-editor-reset").addEventListener("click", () => {
  const chapterKey = storyEditor.dataset.chapterKey;
  storyEditorContent.value = serializeStoryPages(storyPageDefaults[chapterKey] || []);
  workingStoryTextStyles = [];
  renderStoryEditorColorList();
  storyEditor.dataset.resetToDefault = "true";
  storyEditor.dataset.saveStatus = "";
  updateStoryEditorCount();
});
function openStoryEditorAuthentication(defaultChapterKey) {
  storyEditorAuth.dataset.defaultChapterKey = defaultChapterKey;
  storyEditorPassword.value = "";
  storyEditorAuthError.textContent = "";
  storyEditorAuth.showModal();
  storyEditorPassword.focus({ preventScroll: true });
}
hideoutLogoTrigger.addEventListener("click", () => openStoryEditorAuthentication("echo"));
logroomLogoTrigger.addEventListener("click", () => openStoryEditorAuthentication("logroomSceneLog"));
document.getElementById("story-editor-auth-close").addEventListener("click", () => storyEditorAuth.close());
document.getElementById("story-editor-auth-cancel").addEventListener("click", () => storyEditorAuth.close());
storyEditorAuthForm.addEventListener("submit", event => {
  event.preventDefault();
  if (storyEditorPassword.value !== "Raik4volt") {
    storyEditorAuthError.textContent = "パスワードが違います。もう一度入力してください。";
    storyEditorPassword.select();
    return;
  }
  storyEditorAuth.close();
  const preferredChapterKey = storyEditorAuth.dataset.defaultChapterKey;
  const activeChapterKey = getActiveStoryEditKey();
  const modePrefix = preferredChapterKey.startsWith("logroom") ? "logroom" : "hideout";
  const chapterKey = activeChapterKey?.startsWith(modePrefix) ? activeChapterKey : preferredChapterKey;
  storyEditorChapter.value = chapterKey;
  loadStoryEditorChapter(chapterKey);
  storyEditor.showModal();
  storyEditorContent.focus({ preventScroll: true });
});
storyEditor.addEventListener("close", () => storyEditorAuthError.textContent = "");
storyEditor.addEventListener("cancel", event => {
  event.preventDefault();
  closeStoryEditor();
});
let autoAdvanceTimer = null;
let typingTimer = null;
let isTyping = false;
function showStoryPage(index) {
  clearInterval(typingTimer);
  currentStoryPage = index;
  const storyText = document.getElementById("story-text");
  const speaker = document.querySelector(".speaker");
  const storyArt = document.querySelector(".story-art");
  const chapterNumber = document.getElementById("chapter-number");
  const chapterIndex = activeStoryPages === connectStoryPages ? 2
    : activeStoryPages === memoryStoryPages ? 3
      : activeStoryPages === crossroadStoryPages ? 4
        : activeStoryPages === rewindStoryPages ? 5 : 1;
  const logroomChapterLabel = logroomStoryNumber === 5 ? "#5-A Answer / VOLTA"
    : logroomStoryNumber === 1 ? "#1-Logroom"
      : logroomStoryNumber === 2 ? "＃2-LOGROOM"
        : logroomStoryNumber === 3 ? "#3-LOGROOM" : "#4-LOGROOM";
  chapterNumber.textContent = isLogroomStory ? logroomChapterLabel : `♯${chapterIndex}`;
  chapterNumber.setAttribute("aria-label", isLogroomStory ? logroomChapterLabel : `第${chapterIndex}章`);
  const isConnectStory = activeStoryPages === connectStoryPages;
  // 学生証の名前を読んだページから、名前表示を切り替えます。
  speaker.textContent = isLogroomStory ? "雷華-Unstable-"
    : activeStoryPages === memoryStoryPages || activeStoryPages === crossroadStoryPages || (isConnectStory && index >= 3) ? "雷華" : "？？？";
  // 「らいかのさぶ？」の次の2ページだけ、SNS画面を背景にします。
  const showSocialProfile = isConnectStory && (index === 7 || index === 8);
  storyArt.src = showSocialProfile ? "assets/connect-social.png"
    : isLogroomStory ? "assets/logroom-novel-background.png" : "assets/hideout-novel-background.png";
  const characters = Array.from(activeStoryPages[index]);
  const styleRanges = getStoryTextRanges(activeStoryPages[index], index);
  let visibleCount = 0;
  isTyping = true;
  storyText.replaceChildren();
  document.getElementById("story-return-top").disabled = index === 0;
  document.getElementById("story-page").textContent = `${index + 1} / ${activeStoryPages.length}`;
  document.getElementById("story-next").textContent = index === activeStoryPages.length - 1 ? "NEXT" : "▼";
  typingTimer = setInterval(() => {
    visibleCount += 1;
    renderStyledStoryText(activeStoryPages[index], visibleCount, index, styleRanges);
    if (visibleCount >= characters.length) finishTyping();
  }, 70);
}
function finishTyping() {
  clearInterval(typingTimer);
  typingTimer = null;
  isTyping = false;
  renderStyledStoryText(activeStoryPages[currentStoryPage], Array.from(activeStoryPages[currentStoryPage]).length, currentStoryPage);
}
function advanceStory() {
  // 文字が表示中なら、まず全文を見せます。次の操作で次ページへ進みます。
  if (isTyping) {
    finishTyping();
    return;
  }
  if (currentStoryPage < activeStoryPages.length - 1) {
    showStoryPage(currentStoryPage + 1);
  } else {
    showStoryEndCard();
  }
}
storyPanel.addEventListener("click", advanceStory);
storyPanel.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    advanceStory();
  }
});
function returnToHideout() {
  clearInterval(autoAdvanceTimer);
  autoAdvanceTimer = null;
  clearInterval(typingTimer);
  typingTimer = null;
  isTyping = false;
  storyAutoButton.setAttribute("aria-pressed", "false");
  document.getElementById("unlock-card").hidden = true;
  let returnScreen = hideoutScreen;
  if (isLogroomStory) {
    returnScreen = activeStoryPages === logroomAnswerPages
      ? answerStoryReturnScreen
      : logroomLibraryScreen;
  }
  transitionScreens(echoScreen, returnScreen);
}
document.getElementById("story-hideout").addEventListener("click", returnToHideout);
document.getElementById("story-return-top").addEventListener("click", () => {
  if (currentStoryPage <= 0) return;
  clearInterval(autoAdvanceTimer);
  autoAdvanceTimer = null;
  storyAutoButton.setAttribute("aria-pressed", "false");
  showStoryPage(currentStoryPage - 1);
});
function showStoryEndCard() {
  if (!isLogroomStory) {
    showUnlockCard();
    return;
  }
  if (activeStoryPages === logroomAnswerPages) {
    if (!hasSeenLogroomAnswerStory) {
      hasSeenLogroomAnswerStory = true;
      saveBrowserProgress();
    }
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
    storyAutoButton.setAttribute("aria-pressed", "false");
    transitionScreens(echoScreen, logroomTrackScreen);
    return;
  }
  if (logroomStoryNumber === getNextLogroomChapter()) {
    logroomCompletedChapters.add(logroomStoryNumber);
    saveBrowserProgress();
    updateTraceRate();
    updateMainLogAvailability();
  }
  clearInterval(autoAdvanceTimer);
  autoAdvanceTimer = null;
  storyAutoButton.setAttribute("aria-pressed", "false");
  const unlockCard = document.getElementById("unlock-card");
  unlockCard.querySelector("span").textContent = `LOGROOM 0${logroomStoryNumber}`;
  unlockCard.querySelector("small").textContent = "RETURN";
  unlockCard.setAttribute("aria-label", `Logroom 0${logroomStoryNumber}完了。クリックしてLogroomに戻る`);
  unlockCard.hidden = false;
  unlockCard.focus({ preventScroll: true });
}
function showUnlockCard() {
  clearInterval(autoAdvanceTimer);
  autoAdvanceTimer = null;
  storyAutoButton.setAttribute("aria-pressed", "false");
  const chapterIndex = activeStoryPages === connectStoryPages ? 2
    : activeStoryPages === memoryStoryPages ? 3
      : activeStoryPages === crossroadStoryPages ? 4
        : activeStoryPages === rewindStoryPages ? 5 : 1;
  completedChapters.add(chapterIndex);
  saveBrowserProgress();
  updateChapterFiveButton();
  if (chapterIndex === 5) {
    transitionToLogroomHomeFromStory();
    return;
  }
  const unlockCard = document.getElementById("unlock-card");
  unlockCard.querySelector("span").textContent = "Track Unlocked";
  unlockCard.querySelector("small").textContent = "NEXT";
  unlockCard.setAttribute("aria-label", "Track Unlocked。Enterキーまたはクリックでホームに戻る");
  unlockCard.hidden = false;
  unlockCard.focus({ preventScroll: true });
}
document.getElementById("unlock-card").addEventListener("click", () => {
  const unlockCard = document.getElementById("unlock-card");
  unlockCard.hidden = true;
  if (isLogroomStory) {
    unlockCard.querySelector("span").textContent = "Track Unlocked";
    unlockCard.querySelector("small").textContent = "NEXT";
    unlockCard.setAttribute("aria-label", "Track Unlocked。Enterキーまたはクリックでホームに戻る");
    isLogroomStory = false;
    echoScreen.classList.remove("is-logroom");
    document.getElementById("story-hideout").textContent = "Hideoutに戻る";
    transitionScreens(echoScreen, logroomLibraryScreen);
    return;
  }
  const isConnectUnlock = activeStoryPages === connectStoryPages;
  const isMemoryUnlock = activeStoryPages === memoryStoryPages;
  const isCrossroadUnlock = activeStoryPages === crossroadStoryPages;
  const isRewindUnlock = activeStoryPages === rewindStoryPages;
  unlockScreen.classList.toggle("is-connect", isConnectUnlock);
  unlockScreen.classList.toggle("is-memory", isMemoryUnlock);
  unlockScreen.classList.toggle("is-crossroad", isCrossroadUnlock);
  unlockScreen.classList.toggle("is-chapter-five", isRewindUnlock);
  document.querySelector(".unlock-art").src = isConnectUnlock
    ? "assets/track-unlocked-connect.png"
    : isMemoryUnlock ? "assets/track-unlocked-memory.png"
      : isCrossroadUnlock ? "assets/track-unlocked-crossroad.png"
        : isRewindUnlock ? "assets/track-unlocked-005.png" : "assets/track-unlocked.png";
  transitionScreens(echoScreen, unlockScreen);
});
document.getElementById("unlock-hideout").addEventListener("click", () => {
  transitionScreens(unlockScreen, hideoutScreen);
});
document.getElementById("unlock-card").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
});
storyAutoButton.addEventListener("click", () => {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
    storyAutoButton.setAttribute("aria-pressed", "false");
    return;
  }
  storyAutoButton.setAttribute("aria-pressed", "true");
  autoAdvanceTimer = setInterval(() => {
    if (isTyping) return;
    if (currentStoryPage >= activeStoryPages.length - 1) {
      showStoryEndCard();
      return;
    }
    showStoryPage(currentStoryPage + 1);
  }, 3000);
});
