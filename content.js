// 状態定数
const STATE_CORRECT = "CORRECT";            // 正解
const STATE_CORRECT_PICKED = "CORRECT_PICKED"; // 正解かつ選択
const STATE_WRONG = "WRONG";                // 誤答（選択肢のうち誤答判定されたもの）
const STATE_UNSELECTED = "UNSELECTED";      // 未選択

// Udemyの状態spanテキストからstate判定
function detectState(labelText) {
    if (!labelText) return STATE_UNSELECTED;
    if (labelText.includes("正しい選択")) return STATE_CORRECT;
    if (labelText.includes("選択は正解です")) return STATE_CORRECT_PICKED;
    if (labelText.includes("選択は不正解です")) return STATE_WRONG;
    return STATE_UNSELECTED;
}

function addCopyButtonIfNeeded() {
    // 「question-result--question-result--」で始まるdiv
    const questionResultDivs = Array.from(document.querySelectorAll('div[class^="question-result--question-result--"]'));
    questionResultDivs.forEach(resultDiv => {
        // display: flex の直下div
        const flexDiv = Array.from(resultDiv.children).find(
            c => window.getComputedStyle(c).display === "flex"
        );
        if (!flexDiv) return;

        // 既にボタンが存在していたら追加しない
        if (flexDiv.querySelector(".udemy-copy-btn")) return;

        // ボタン作成
        const btn = document.createElement("button");
        btn.textContent = "クリップボードへコピー";
        btn.className = "ud-btn udemy-copy-btn";
        btn.style.marginLeft = "12px";
        btn.onclick = copyQAToClipboard;

        flexDiv.appendChild(btn);
    });
}

// コピーボタンのクリック時の処理
async function copyQAToClipboard() {
    try {
        // 問題文
        const prompt = document.querySelector("#question-prompt")?.innerText.trim() || "";
        if (!prompt) {
            alert("問題文が取得できません");
            return;
        }

        // 回答
        const answerDivs = Array.from(document.querySelectorAll('div[class^="result-pane--answer-result-pane--"]'));
        const answers = answerDivs.map(div => {
            const labelSpan = div.querySelector('span[data-purpose="answer-result-header-user-label"]');
            const labelText = labelSpan ? labelSpan.textContent.trim() : "";
            const state = detectState(labelText);
            return { state, answerDiv: div };
        });

        // フォーマット指定をここに反映
        const formatted = await generateFormattedOutput(prompt, answers);

        // クリップボードにコピー
        await navigator.clipboard.writeText(formatted);

        // 完了通知
        alert("コピーしました！");
    } catch (e) {
        alert("エラー: " + e.message);
    }
}

// フォーマット生成（複数回答/複数正解対応）
async function generateFormattedOutput(prompt, answers) {
    let lines = [];
    lines.push("【問題文】");
    lines.push(prompt + "\n");

    let pickedIdxs = [];
    let correctIdxs = [];
    let numberedAnswers = [];

    answers.forEach((a, idx) => {
        // 正解（「正しい選択」 or 「選択は正解です」）
        if (a.state === STATE_CORRECT || a.state === STATE_CORRECT_PICKED) correctIdxs.push(idx);
        // 自分が選択したもの（「選択は正解です」or「選択は不正解です」）
        if (a.state === STATE_CORRECT_PICKED || a.state === STATE_WRONG) pickedIdxs.push(idx);

        // 回答本文
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
    lines.push("初学者でも分かるように各回答の正誤に関しての根拠を説明してください。");
    lines.push("今後似た問題を解く際に応用が効くように根本的な理解をしたいです。");
    return lines.join("\n");
}

// ページ更新・Ajax再描画対策
setInterval(addCopyButtonIfNeeded, 1000);
