// ============================================
// API設定 - デプロイ時にURLを変更してください
// ============================================
const API_BASE = "https://mr4t9jy6j2.execute-api.ap-northeast-1.amazonaws.com";

// ============================================
// 簡易パスワード保護
// ============================================
(function () {
  const pw = prompt("パスワードを入力してください");
  if (pw !== "ogori2026") {
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:#fff;font-size:18px;font-family:sans-serif;text-align:center;padding:20px;">🔒 アクセス権限がありません</div>';
    throw new Error("Unauthorized");
  }
})();

// ============================================
// タブ切り替え
// ============================================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));

    document.getElementById(`tab-${tab}`).classList.add("active");
    btn.classList.add("active");
  });
});

// ============================================
// 初期値設定
// ============================================
const today = new Date().toISOString().split("T")[0];
document.getElementById("res-date").value = today;

// ============================================
// 日付バリデーション（月水金のみ）
// ============================================
document.getElementById("sch-date").addEventListener("input", function () {
  const date = new Date(this.value + "T00:00:00");
  const day = date.getDay();

  if (![1, 3, 5].includes(day)) {
    this.value = "";
    showResult("schedule-result", "error", "⚠️ 月・水・金のみ選択できます");
  } else {
    hideResult("schedule-result");
  }
});

// ============================================
// ユーティリティ関数
// ============================================

/** ボタンのローディング状態を切り替える */
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (loading) {
    btn.classList.add("loading");
    btn.disabled = true;
  } else {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

/** 結果メッセージを表示する */
function showResult(elementId, type, message) {
  const el = document.getElementById(elementId);
  el.className = `result-message ${type}`;
  el.textContent = message;
  el.style.display = "block";   
}


/** 結果メッセージを非表示にする */
function hideResult(elementId) {
  const el = document.getElementById(elementId);
  el.className = "result-message";
  el.style.display = "none";
}

// ============================================
// 1. ユーザー登録
// ============================================
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading("registerBtn", true);
  hideResult("register-result");

  // 性別チェック
  const gender = document.querySelector('input[name="gender"]:checked');
  if (!gender) {
    showResult("register-result", "error", "⚠️ 性別を選択してください");
    setLoading("registerBtn", false);
    return;
  }

  // 全項目入力チェック
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const department = document.getElementById("reg-department").value;
  const joinYear = document.getElementById("reg-joinYear").value;
  const floor = document.getElementById("reg-floor").value;

  if (!name || !email || !department || !joinYear || !floor) {
    showResult("register-result", "error", "⚠️ 全ての項目を入力してください");
    setLoading("registerBtn", false);
    return;
  }

  const body = {
    name: name,
    email: email,
    department: department,
    joinYear: parseInt(joinYear),
    gender: gender.value,
    floor: parseInt(floor),
  };

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      showResult("register-result", "success", `🎉 ${body.name}さん、ユーザー登録が完了しました！`);
      document.getElementById("registerForm").reset();
    } else if (res.status === 409) {
      showResult("register-result", "error", "⚠️ このメールアドレスは既に登録されています");
    } else if (res.status === 400) {
      showResult("register-result", "error", `⚠️ ${data.error || "入力内容に誤りがあります"}`);
    } else {
      showResult("register-result", "error", `❌ ${data.error || "エラーが発生しました"}`);
    }
  } catch (err) {
    showResult("register-result", "error", "❌ 通信エラーが発生しました。ネットワーク接続を確認してください");
  }

  setLoading("registerBtn", false);
});

// ============================================
// 2. スケジュール登録
// ============================================
document.getElementById("scheduleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading("scheduleBtn", true);
  hideResult("schedule-result");

  // メールアドレスチェック
  const email = document.getElementById("sch-email").value.trim();
  if (!email) {
    showResult("schedule-result", "error", "⚠️ メールアドレスを入力してください");
    setLoading("scheduleBtn", false);
    return;
  }

  // 日付チェック
  const date = document.getElementById("sch-date").value;
  if (!date) {
    showResult("schedule-result", "error", "⚠️ 参加日を選択してください");
    setLoading("scheduleBtn", false);
    return;
  }

  // 時間帯チェック
  const checked = document.querySelectorAll(".time-option input:checked");
  if (checked.length === 0) {
    showResult("schedule-result", "error", "⚠️ 1つ以上の時間帯を選択してください");
    setLoading("scheduleBtn", false);
    return;
  }

  const timeSlots = Array.from(checked).map((cb) => cb.value);

  const body = {
    email: email,
    date: date,
    timeSlots: timeSlots,
  };

  try {
    const res = await fetch(`${API_BASE}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      showResult(
        "schedule-result",
        "success",
        `🎉 ${date} の ${timeSlots.length}件の時間帯を登録しました！マッチング結果をお楽しみに`
      );
      checked.forEach((cb) => (cb.checked = false));
    } else if (res.status === 403) {
      showResult("schedule-result", "error", "⚠️ ユーザー登録がまだ完了していません。先にユーザー登録を行ってください");
    } else if (res.status === 400) {
      showResult("schedule-result", "error", `⚠️ ${data.error || "入力内容に誤りがあります"}`);
    } else {
      showResult("schedule-result", "error", `❌ ${data.error || "エラーが発生しました"}`);
    }
  } catch (err) {
    showResult("schedule-result", "error", "❌ 通信エラーが発生しました。ネットワーク接続を確認してください");
  }

  setLoading("scheduleBtn", false);
});

// ============================================
// 3. マッチング結果確認
// ============================================
document.getElementById("resultForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading("resultBtn", true);
  hideResult("match-result");
  document.getElementById("match-card").classList.remove("show");

  // メールアドレスチェック
  const email = document.getElementById("res-email").value.trim();
  if (!email) {
    showResult("match-result", "error", "⚠️ メールアドレスを入力してください");
    setLoading("resultBtn", false);
    return;
  }

  // 日付チェック
  const date = document.getElementById("res-date").value;
  if (!date) {
    showResult("match-result", "error", "⚠️ 日付を選択してください");
    setLoading("resultBtn", false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/matches?email=${encodeURIComponent(email)}&date=${date}`);
    const data = await res.json();

    if (res.ok) {
      if (data.matched && data.partner) {
        // マッチング成立
        document.getElementById("match-time-val").textContent = data.timeSlot || "--:--";
        document.getElementById("match-partner-name").textContent = data.partner.name;
        document.getElementById("match-partner-dept").textContent = data.partner.department;
        document.getElementById("match-partner-floor").textContent = data.partner.floor;
        document.getElementById("match-card").classList.add("show");
        showResult("match-result", "success", "🎉 マッチングが成立しました！以下の相手と自販機前で待ち合わせしましょう");
      } else {
        // マッチング未成立
        showResult(
          "match-result",
          "error",
          `😢 ${data.message || "本日のマッチング結果はまだありません"}`
        );
      }
    } else if (res.status === 404) {
      showResult("match-result", "error", "⚠️ ユーザーが見つかりません。先にユーザー登録を行ってください");
    } else {
      showResult("match-result", "error", `❌ ${data.error || "エラーが発生しました"}`);
    }
  } catch (err) {
    showResult("match-result", "error", "❌ 通信エラーが発生しました。ネットワーク接続を確認してください");
  }

  setLoading("resultBtn", false);
});