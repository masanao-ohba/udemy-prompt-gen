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
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/><circle cx="9.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none"/></svg>';
    btn.className = "udemy-copy-btn";
    btn.title = "AIに質問するためコピー";
    btn.setAttribute("style", "margin-left:8px !important;padding:5px 8px !important;cursor:pointer !important;background:#7c3aed !important;border:none !important;border-radius:6px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;color:#fff !important;min-width:auto !important;min-height:auto !important;width:auto !important;height:auto !important;align-self:center !important;line-height:1 !important;box-sizing:content-box !important;transition:background 0.15s,transform 0.1s !important;opacity:0.9 !important;");
    btn.onmouseenter = function() { this.style.setProperty("background", "#6d28d9", "important"); this.style.setProperty("opacity", "1", "important"); };
    btn.onmouseleave = function() { this.style.setProperty("background", "#7c3aed", "important"); this.style.setProperty("opacity", "0.9", "important"); };
    btn.onmousedown = function() { this.style.setProperty("transform", "scale(0.93)", "important"); };
    btn.onmouseup = function() { this.style.setProperty("transform", "scale(1)", "important"); };
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
    const answerDivs = Array.from(document.querySelectorAll('div[class^="result-pane--answer-result-pane--"]'));
    const answers = answerDivs.map(div => {
      const labelSpan = div.querySelector('span[data-purpose="answer-result-header-user-label"]');
      const labelText = labelSpan ? labelSpan.textContent.trim() : "";
      const state = detectState(labelText);
      return { state, answerDiv: div };
    });
    const formatted = await generateFormattedOutput(prompt, answers);
    await navigator.clipboard.writeText(formatted);
    const btn = this;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    btn.style.setProperty("background", "#16a34a", "important");
    btn.style.setProperty("color", "#fff", "important");
    setTimeout(() => { btn.innerHTML = originalHTML; btn.style.setProperty("background", "#7c3aed", "important"); btn.style.setProperty("color", "#fff", "important"); }, 2000);
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
      answerText = a.answerDiv.querySelector('[data-purpose="answer-body"]').innerText.trim();
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

