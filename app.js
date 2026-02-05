// ---- QUESTIONS (your exact wording) ----
const ACE_QUESTIONS = [
  { id: 1, text: "Did a parent or other adult in the household often or very often... Swear at you, insult you, put you down, or humiliate you? or Act in a way that made you afraid that you might be physically hurt?" },
  { id: 2, text: "Did a parent or other adult in the household often or very often... Push, grab, slap, or throw something at you? or Ever hit you so hard that you had marks or were injured?" },
  { id: 3, text: "Did an adult or person at least five years older than you ever... Touch or fondle you or have you touch their body in a sexual way? or Attempt or actually have oral, anal, or vaginal intercourse with you?" },
  { id: 4, text: "Did you often or very often feel that... No one in your family loved you or thought you were important or special? or Your family didn’t look out for each other, feel close to each other, or support each other?" },
  { id: 5, text: "Did you often or very often feel that... You didn’t have enough to eat, had to wear dirty clothes, and had no one to protect you? or Your parents were too drunk or high to take care of you or take you to the doctor if you needed it?" },
  { id: 6, text: "Were your parents ever separated or divorced? If so rate the degree of tension, expressed anger, altercations, fear you experienced as both a witness or personally." },
  { id: 7, text: "Was your mother or stepmother: Often or very often pushed, grabbed, slapped, or had something thrown at her? or Sometimes, often, or very often kicked, bitten, hit with a fist, or hit with something hard? or Ever repeatedly hit at least a few minutes or threatened with a gun or knife?" },
  { id: 8, text: "Did you live with anyone who was a problem drinker or alcoholic or who used street drugs?" },
  { id: 9, text: "Was a household member depressed or mentally ill, or did a household member attempt suicide?" },
  { id: 10, text: "Did a household member go to prison or be deployed for more than a few days?" }
];

// ---- SCORING ----
function computeItemTotal(freq, sev) {
  return freq + sev;
}

// ---- UI BUILD ----
const container = document.getElementById("questions");

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeQuestionCard(q) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.qid = String(q.id);

  card.innerHTML = `
    <div class="qhead">
      <div class="qtext"><span class="qnum">${q.id}.</span>${escapeHtml(q.text)}</div>
      <div class="rightbox">
        <div class="totalbadge">Total: <span class="itemTotal" id="itemTotal_${q.id}">0</span></div>
      </div>
    </div>

    <div class="toggle">
      <label>
        <input type="checkbox" class="yesToggle" id="yes_${q.id}">
        Yes (enable Frequency/Severity)
      </label>
      <span class="muted">(If No, leave unchecked and move on.)</span>
    </div>

    <div class="row">
      <div class="label">Frequency</div>
      <input type="range" min="1" max="10" value="1" step="1" class="slider freq" id="freq_${q.id}" disabled>
      <div class="value"><span id="freqVal_${q.id}">1</span></div>
    </div>

    <div class="row">
      <div class="label">Severity</div>
      <input type="range" min="1" max="10" value="1" step="1" class="slider sev" id="sev_${q.id}" disabled>
      <div class="value"><span id="sevVal_${q.id}">1</span></div>
    </div>
  `;
  return card;
}

ACE_QUESTIONS.forEach(q => container.appendChild(makeQuestionCard(q)));

// ---- STATE + EVENTS ----
function getCardState(qid) {
  const yes = document.getElementById(`yes_${qid}`).checked;
  const freq = Number(document.getElementById(`freq_${qid}`).value);
  const sev  = Number(document.getElementById(`sev_${qid}`).value);
  return { yes, freq, sev };
}

function setSlidersEnabled(qid, enabled) {
  document.getElementById(`freq_${qid}`).disabled = !enabled;
  document.getElementById(`sev_${qid}`).disabled  = !enabled;
}

function updateItem(qid) {
  const { yes, freq, sev } = getCardState(qid);

  document.getElementById(`freqVal_${qid}`).textContent = String(freq);
  document.getElementById(`sevVal_${qid}`).textContent  = String(sev);

  const itemTotal = yes ? computeItemTotal(freq, sev) : 0;
  document.getElementById(`itemTotal_${qid}`).textContent = String(itemTotal);

  updateOverall();
}

function updateOverall() {
  let sum = 0;
  for (const q of ACE_QUESTIONS) {
    const { yes, freq, sev } = getCardState(q.id);
    if (yes) sum += computeItemTotal(freq, sev);
  }
  document.getElementById("overallTotal").textContent = String(sum);
}

for (const q of ACE_QUESTIONS) {
  const qid = q.id;

  const yes = document.getElementById(`yes_${qid}`);
  const freq = document.getElementById(`freq_${qid}`);
  const sev  = document.getElementById(`sev_${qid}`);

  yes.addEventListener("change", () => {
    setSlidersEnabled(qid, yes.checked);
    updateItem(qid);
  });

  freq.addEventListener("input", () => updateItem(qid));
  sev.addEventListener("input",  () => updateItem(qid));

  setSlidersEnabled(qid, false);
  updateItem(qid);
}

document.getElementById("resetBtn").addEventListener("click", () => {
  for (const q of ACE_QUESTIONS) {
    document.getElementById(`yes_${q.id}`).checked = false;
    document.getElementById(`freq_${q.id}`).value = "1";
    document.getElementById(`sev_${q.id}`).value  = "1";
    setSlidersEnabled(q.id, false);
    updateItem(q.id);
  }
  document.getElementById("exportOut").style.display = "none";
  document.getElementById("exportOut").textContent = "";
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const payload = {
    tool: "ACEs 2.0 Frequency/Severity",
    createdAt: new Date().toISOString(),
    items: ACE_QUESTIONS.map(q => {
      const { yes, freq, sev } = getCardState(q.id);
      return {
        id: q.id,
        question: q.text,
        yes,
        frequency: yes ? freq : 0,
        severity: yes ? sev : 0,
        total: yes ? computeItemTotal(freq, sev) : 0
      };
    }),
    overallTotal: Number(document.getElementById("overallTotal").textContent)
  };

  const out = document.getElementById("exportOut");
  out.textContent = JSON.stringify(payload, null, 2);
  out.style.display = "block";
  out.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("printBtn").addEventListener("click", () => window.print());
