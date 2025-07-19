// 状態定数
const STATE_CORRECT = "CORRECT";
const STATE_CORRECT_PICKED = "CORRECT_PICKED";
const STATE_WRONG = "WRONG";
const STATE_UNSELECTED = "UNSELECTED";
// 状態判定ロジック（日本語パターン全部対応）
function detectState(labelText) {
  if (!labelText) return STATE_UNSELECTED;
  if (labelText.includes("回答は正解です") || labelText.includes("選択は正解です")) return STATE_CORRECT_PICKED;
  if (labelText.includes("回答は不正解です") || labelText.includes("選択は不正解です")) return STATE_WRONG;
  if (labelText.includes("正しい選択") || labelText.includes("正解")) return STATE_CORRECT;
  return STATE_UNSELECTED;
}
function addCopyButtonIfNeeded() {
  const questionResultDivs = Array.from(document.querySelectorAll('div[class^="question-result--question-result--"]'));
  questionResultDivs.forEach(resultDiv => {
    const flexDiv = Array.from(resultDiv.children).find(
      c => window.getComputedStyle(c).display === "flex"
    );
    if (!flexDiv) return;
    if (flexDiv.querySelector(".udemy-copy-btn")) return;
    const btn = document.createElement("button");
    btn.textContent = "クリップボードへコピー";
    btn.className = "ud-btn ud-btn-small ud-btn-primary udemy-copy-btn";
    // 最低限のインラインスタイル（必要に応じて調整してください）
    btn.style.marginLeft = "12px";
    btn.style.padding = "4px 8px";
    btn.style.fontSize = "14px";
    btn.style.cursor = "pointer";
    btn.style.borderRadius = "4px";
    btn.style.border = "1px solid #ccc";
    // btn.style.backgroundColor = "#f0f0f0";
    btn.onclick = copyQAToClipboard;
    flexDiv.appendChild(btn);
  });
}
async function copyQAToClipboard() {
  try {
    const prompt = document.querySelector("#question-prompt")?.innerText.trim() || "";
    if (!prompt) {
      alert("問題文が取得できません");
      return;
    }
    const answerDivs = Array.from(document.querySelectorAll('div#answer-text'));
    const answers = answerDivs.map(div => {
      // 回答選択肢の文言
      const answerLabel = div ? div.textContent.trim() : "";
      // 正答状態要素 (親要素の兄弟要素から取得)
      const resultLabelElement = div.parentElement.querySelector("span[data-purpose='answer-result-header-user-label']");
      // 正答状態の文言
      const resultLabel = resultLabelElement ? resultLabelElement.textContent.trim() : "";
      const state = detectState(resultLabel);
      return { state, answerDiv: div };
    });
    const formatted = await generateFormattedOutput(prompt, answers);
    await navigator.clipboard.writeText(formatted);
    alert("コピーしました！");
  } catch (e) {
    console.error("コピーエラー:", e);
    alert("エラーが発生しました: " + (e.message || e));
  }
}
async function generateFormattedOutput(prompt, answers) {
  let lines = [];
  lines.push("【問題文】");
  lines.push(prompt + "\n");
  let pickedIdxs = [];
  let correctIdxs = [];
  let numberedAnswers = [];
  answers.forEach((a, idx) => {
    if (a.state === STATE_CORRECT || a.state === STATE_CORRECT_PICKED) correctIdxs.push(idx);
    if (a.state === STATE_CORRECT_PICKED || a.state === STATE_WRONG) pickedIdxs.push(idx);
    let answerText = "";
    if (a.answerDiv) {
      let clone = a.answerDiv.cloneNode(true);
      clone.querySelectorAll('span[data-purpose="answer-result-header-user-label"]').forEach(e => e.remove());
      answerText = clone.innerText.trim();
    }
    numberedAnswers.push(answerText);
  });
  numberedAnswers.forEach((txt, idx) => {
    lines.push(`【回答${idx + 1}】\n${txt}\n`);
  });
  lines.push("---");
  const pickedStr = pickedIdxs.length > 0 ? pickedIdxs.map(i => i + 1).join(",") : "未選択";
  const correctStr = correctIdxs.length > 0 ? correctIdxs.map(i => i + 1).join(",") : "不明";
  lines.push(`私は回答${pickedStr}を選択し、正解は回答${correctStr}でした。`);
  lines.push("");
  lines.push("初学者でも分かるように各回答の正誤に関しての根拠を説明してください。");
  lines.push("回答ごとの説明する順番は「回答者の選択肢が不正解なら最初」「正解の選択肢は最後」に従ってください。");
  lines.push("今後似た問題を解く際に応用が効くように根本的な理解をしたいです。");
  return lines.join("\n");
}
// DOM変化を監視しボタン追加を効率的に行う
const observer = new MutationObserver(() => addCopyButtonIfNeeded());
observer.observe(document.body, { childList: true, subtree: true });
// 初回呼び出し
addCopyButtonIfNeeded();

