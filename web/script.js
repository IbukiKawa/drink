// ============================================
// API設定 - デプロイ時にURLを変更してください
// ============================================
const API_BASE = "https://drink-matching-web-202516976897.s3.ap-northeast-1.amazonaws.com/index.html";

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
  const day = date.getDay(); // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土

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

  const gender = document.querySelector('input[name="gender"]:checked');
  if (!gender) {
    showResult("register-result", "error", "性別を選択してください");
    setLoading("registerBtn", false);
    return;
  }

  const body = {
    name: document.getElementById("reg-name").value,
    email: document.getElementById("reg-email").value,
    department: document.getElementById("reg-department").value,
    joinYear: parseInt(document.getElementById("reg-joinYear").value),
    gender: gender.value,
    floor: parseInt(document.getElementById("reg-floor").value),
  };

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      showResult("register-result", "success", "🎉 登録が完了しました！");
      document.getElementById("registerForm").reset();
    } else {
      showResult("register-result", "error", `❌ ${data.error || "エラーが発生しました"}`);
    }
  } catch (err) {
    showResult("register-result", "error", "❌ 通信エラーが発生しました");
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

  const checked = document.querySelectorAll(".time-option input:checked");
  if (checked.length === 0) {
    showResult("schedule-result", "error", "1つ以上の時間帯を選択してください");
    setLoading("scheduleBtn", false);
    return;
  }

  const timeSlots = Array.from(checked).map((cb) => cb.value);

  const body = {
    email: document.getElementById("sch-email").value,
    date: document.getElementById("sch-date").value,
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
      showResult("schedule-result", "success", `🎉 ${timeSlots.length}件の時間帯を登録しました！`);
      checked.forEach((cb) => (cb.checked = false));
    } else {
      showResult("schedule-result", "error", `❌ ${data.error || "エラーが発生しました"}`);
    }
  } catch (err) {
    showResult("schedule-result", "error", "❌ 通信エラーが発生しました");
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

  const email = document.getElementById("res-email").value;
  const date = document.getElementById("res-date").value;

  try {
    const res = await fetch(`${API_BASE}/matches?email=${encodeURIComponent(email)}&date=${date}`);
    const data = await res.json();

    if (res.ok) {
      if (data.matched) {
        document.getElementById("match-time-val").textContent = data.timeSlot || "--:--";
        document.getElementById("match-partner-name").textContent = data.partner.name;
        document.getElementById("match-partner-dept").textContent = data.partner.department;
        document.getElementById("match-partner-floor").textContent = data.partner.floor;
        document.getElementById("match-card").classList.add("show");
      } else {
        showResult("match-result", "error", "😢 今回はマッチング相手が見つかりませんでした。次回もぜひご参加ください！");
      }
    } else {
      showResult("match-result", "error", `❌ ${data.error || "エラーが発生しました"}`);
    }
  } catch (err) {
    showResult("match-result", "error", "❌ 通信エラーが発生しました");
  }

  setLoading("resultBtn", false);
});