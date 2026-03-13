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
        btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
        btn.className = "udemy-copy-btn";
        btn.title = "クリップボードへコピー";
        btn.setAttribute("style", "margin-left:8px !important;padding:4px !important;cursor:pointer !important;background:none !important;border:1px solid #ccc !important;border-radius:3px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;color:#6a6f73 !important;min-width:auto !important;min-height:auto !important;width:auto !important;height:auto !important;align-self:center !important;line-height:1 !important;box-sizing:content-box !important;");
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
        btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
        btn.style.color = "#1e8e3e";
        setTimeout(() => { btn.innerHTML = originalHTML; btn.style.color = "#6a6f73"; }, 2000);
    } catch (e) {
        alert("エラー: " + e.message);
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
        // 正解（正しい選択 or 回答は正解です）
        if (a.state === STATE_CORRECT || a.state === STATE_CORRECT_PICKED) correctIdxs.push(idx);
        // 自分が選択（回答は正解です or 回答は不正解です）
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
    lines.push(``);
    lines.push("初学者でも分かるように各回答の正誤に関しての根拠を説明してください。");
    lines.push("回答ごとの説明する順番は「回答者の選択肢が不正解なら最初」「正解の選択肢は最後」に従ってください。");
    lines.push("今後似た問題を解く際に応用が効くように根本的な理解をしたいです。");
    return lines.join("\n");
}

setInterval(addCopyButtonIfNeeded, 1000);
