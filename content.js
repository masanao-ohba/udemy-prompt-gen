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
        btn.textContent = "プロンプトをコピー";
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
            let state = "未選択";
            if (labelSpan) {
                const txt = labelSpan.textContent.trim();
                if (txt === "正解" || txt === "回答は正解です") state = "正解";
                else if (txt === "回答は不正解です") state = "誤答";
            }
            // answerDivを渡す
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

async function generateFormattedOutput(prompt, answers) {
    let lines = [];
    lines.push("【問題文】");
    lines.push(prompt + "\n");

    let pickedIdx = null;
    let correctIdx = null;
    let numberedAnswers = [];

    answers.forEach((a, idx) => {
        if (a.state === "正解") correctIdx = idx;
        if (a.state === "誤答") pickedIdx = idx;

        // answerDivが未定義の場合は空文字
        let answerText = "";
        if (a.answerDiv) {
            let clone = a.answerDiv.cloneNode(true);
            clone.querySelectorAll('span[data-purpose="answer-result-header-user-label"]').forEach(e => e.remove());
            answerText = clone.innerText.trim();
        }
        numberedAnswers.push(answerText);
    });

    if (pickedIdx === null && correctIdx !== null) pickedIdx = correctIdx;

    numberedAnswers.forEach((txt, idx) => {
        lines.push(`【回答${idx + 1}】\n${txt}\n`);
    });

    lines.push("---");
    if (pickedIdx !== null && correctIdx !== null) {
        lines.push(`私は回答${pickedIdx + 1}を選択し、正解は回答${correctIdx + 1}でした。`);
    } else {
        lines.push("選択/正解の取得に失敗しました。");
    }
    lines.push("初学者でも分かるように各回答の正誤に関しての根拠を説明してください。");
    lines.push("今後似た問題を解く際に応用が聞くように根本的な理解をしたいです。");
    return lines.join("\n");
}










// ページ更新・Ajax再描画対策
setInterval(addCopyButtonIfNeeded, 1000);

