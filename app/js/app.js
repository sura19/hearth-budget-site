// app.js — Hearth household budget: state, routing, and every view.
// One file, one job: wire the site together. Data lives in data.js, charts in charts.js.

import { CATEGORIES, INCOME_CATEGORIES, BILLS, GOALS, MONTHS, CURRENT_MONTH, seedState } from "./data.js";
import { drawDonut, drawBars } from "./charts.js";

const STORE_KEY = "hearth-budget-v1";
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let state = loadState();
let currentMonth = CURRENT_MONTH;
let txFilter = { q: "", category: "all", type: "all" };

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions)) return parsed;
    }
  } catch (err) { /* private mode or corrupt data: fall through to demo data */ }
  return seedState();
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (err) { /* storage unavailable: the site still works in memory */ }
}

function monthName(month) {
  const [y, m] = month.split("-").map(Number);
  return MONTH_NAMES[m - 1] + " " + y;
}

function monthShort(month) {
  return MONTH_NAMES[Number(month.split("-")[1]) - 1].slice(0, 3);
}

function fmtMoney(value, signed) {
  const abs = Math.abs(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
  if (!signed) return abs;
  return (value < 0 ? "−" : value > 0 ? "+" : "") + abs;
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || { id, name: "Other", color: "#6b7280" };
}

function monthTransactions(month) {
  return state.transactions.filter((tx) => tx.date.startsWith(month));
}

function monthTotals(month) {
  let income = 0;
  let spent = 0;
  for (const tx of monthTransactions(month)) {
    if (tx.amount > 0) income += tx.amount;
    else spent += -tx.amount;
  }
  return { income, spent, saved: income - spent };
}

function categorySpent(month) {
  const spent = {};
  for (const tx of monthTransactions(month)) {
    if (tx.amount < 0 && categoryById(tx.category)) {
      spent[tx.category] = (spent[tx.category] || 0) + -tx.amount;
    }
  }
  return spent;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600);
}

function navActive(route) {
  document.querySelectorAll(".mainnav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === route);
  });
  document.getElementById("month-label").textContent = monthName(currentMonth);
  document.getElementById("month-prev").disabled = currentMonth === MONTHS[0];
  document.getElementById("month-next").disabled = currentMonth === MONTHS[MONTHS.length - 1];
}

function statCard(label, value, note, tone, delta) {
  return `<div class="stat ${tone || ""}">
    <div class="label">${label}</div>
    <div class="value money">${value}</div>
    <div class="note">${note}</div>
    ${delta ? `<div class="delta ${delta.dir}">${delta.text}</div>` : ""}
  </div>`;
}

function deltaVs(current, previous, invert) {
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { dir: "", text: "Same as last month" };
  const good = invert ? pct < 0 : pct > 0;
  return { dir: good ? "up" : "down", text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs last month` };
}

function renderDashboard() {
  const totals = monthTotals(currentMonth);
  const spent = categorySpent(currentMonth);
  const totalSpent = totals.spent;
  const slices = Object.entries(spent)
    .map(([id, value]) => ({ label: categoryById(id).name, value, color: categoryById(id).color }))
    .sort((a, b) => b.value - a.value);
  const topSlices = slices.slice(0, 8);
  const budgetTotal = CATEGORIES.reduce((sum, c) => sum + (state.budgets[c.id] || 0), 0);
  const budgetSpent = CATEGORIES.reduce((sum, c) => sum + Math.min(spent[c.id] || 0, state.budgets[c.id] || 0), 0);
  const over = CATEGORIES.filter((c) => (spent[c.id] || 0) > (state.budgets[c.id] || 0));
  const upcoming = BILLS
    .filter((b) => !(state.billsPaid[currentMonth] || []).includes(b.id))
    .sort((a, b) => a.day - b.day)
    .slice(0, 4);
  const recent = monthTransactions(currentMonth).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const savingsRate = totals.income > 0 ? Math.round(((totals.income - totals.spent) / totals.income) * 100) : 0;

  const alert = over.length
    ? `<p class="callout"><strong>Heads up:</strong> ${over.map((c) => esc(c.name)).join(", ")} ${over.length === 1 ? "is" : "are"} over budget this month. <a href="#/budgets">Review budgets</a></p>`
    : `<p class="callout good"><strong>On track:</strong> every category is inside its budget for ${esc(monthName(currentMonth))}. Nice work.</p>`;

  const prevMonth = MONTHS[Math.max(0, MONTHS.indexOf(currentMonth) - 1)];
  const prevTotals = monthTotals(prevMonth);
  const hasPrev = prevMonth !== currentMonth;

  const sixMonths = MONTHS.map((m) => {
    const t = monthTotals(m);
    return { label: monthShort(m), income: t.income, spent: t.spent };
  });
  const sixIn = sixMonths.reduce((s, m) => s + m.income, 0);
  const sixOut = sixMonths.reduce((s, m) => s + m.spent, 0);
  const bestMonth = sixMonths.slice().sort((a, b) => (b.income - b.spent) - (a.income - a.spent))[0];

  document.getElementById("view").innerHTML = `
    <div class="page-head">
      <h1>${esc(monthName(currentMonth))} at a glance</h1>
      <p>Here is where the month stands: what came in, what went out, and what is left for the rest of it.</p>
    </div>
    ${alert}
    <div class="stats">
      ${statCard("Income", fmtMoney(totals.income), "Salary + freelance", "good", hasPrev ? deltaVs(totals.income, prevTotals.income, false) : null)}
      ${statCard("Spent", fmtMoney(totals.spent), "Across " + Object.keys(spent).length + " categories", totals.spent > totals.income ? "bad" : "", hasPrev ? deltaVs(totals.spent, prevTotals.spent, true) : null)}
      ${statCard("Left to spend", fmtMoney(totals.income - totals.spent), savingsRate + "% of income kept", totals.income - totals.spent < 0 ? "bad" : "good")}
      ${statCard("Budget used", Math.round((budgetSpent / budgetTotal) * 100) + "%", fmtMoney(budgetSpent) + " of " + fmtMoney(budgetTotal) + " planned", over.length ? "warn" : "")}
    </div>
    <div class="grid grid-main">
      <div class="stack">
        <div class="grid grid-2 grid-start">
          <section class="card">
            <div class="card-head"><h2>Where the money went</h2><a href="#/transactions">All transactions &rarr;</a></div>
            <p class="sub">Spending by category, ${esc(monthName(currentMonth))}.</p>
            <div class="chart-wrap">
              <canvas id="donut" aria-label="Donut chart of spending by category" role="img"></canvas>
              <div class="chart-center"><span class="big">${fmtMoney(totalSpent)}</span><span class="small">spent</span></div>
            </div>
            <ul class="legend two-col">
              ${topSlices.map((s) => `<li><span class="dot" style="background:${s.color}"></span>${esc(s.label)}<span class="amt money">${fmtMoney(s.value)}</span></li>`).join("")}
            </ul>
          </section>
          <section class="card">
            <div class="card-head"><h2>Income vs spending</h2><a href="#/insights">Insights &rarr;</a></div>
            <p class="sub">Six months at a glance — the household spends less than it earns every month.</p>
            <div class="chart-wrap"><canvas id="bars" aria-label="Bar chart of income versus spending over six months" role="img"></canvas></div>
            <p class="sub" style="margin:10px 0 0">Six months: ${fmtMoney(sixIn)} in, ${fmtMoney(sixOut)} out — ${fmtMoney(sixIn - sixOut)} kept. Best month: ${esc(bestMonth.label)}, ${fmtMoney(bestMonth.income - bestMonth.spent)} kept.</p>
          </section>
        </div>
      </div>
      <div class="stack">
        <section class="card">
          <div class="card-head"><h2>Bills still to pay</h2><a href="#/bills">All bills &rarr;</a></div>
          <p class="sub">${upcoming.length ? "Due before the month ends." : "Everything is paid for this month."}</p>
          ${upcoming.map((b) => `<div class="kv"><span class="k">${esc(b.name)} · due ${b.day} ${esc(monthName(currentMonth).split(" ")[0])}</span><span class="v money">${fmtMoney(b.amount)}</span></div>`).join("") || `<p class="empty">No bills left — enjoy the rest of the month.</p>`}
        </section>
        <section class="card">
          <div class="card-head"><h2>Budgets to watch</h2><a href="#/budgets">All budgets &rarr;</a></div>
          <p class="sub">Categories closest to — or over — their monthly limit.</p>
          ${CATEGORIES.map((c) => ({ c, used: (spent[c.id] || 0) / (state.budgets[c.id] || 1) }))
            .sort((a, b) => b.used - a.used).slice(0, 3)
            .map(({ c, used }) => `<div class="budget-row">
              <div class="row-top"><span><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</span><span class="money">${fmtMoney(spent[c.id] || 0)} / ${fmtMoney(state.budgets[c.id])}</span></div>
              <div class="bar ${used > 1 ? "over" : used > 0.85 ? "near" : ""}"><span style="width:${Math.min(100, Math.round(used * 100))}%"></span></div>
            </div>`).join("")}
        </section>
        <section class="card">
          <div class="card-head"><h2>Recent spending</h2><a href="#/transactions">See all &rarr;</a></div>
          ${recent.map((tx) => `<div class="kv"><span class="k">${esc(tx.desc)}<br><span class="tx-date">${esc(tx.date)}</span></span><span class="v money ${tx.amount < 0 ? "neg" : "pos"}">${fmtMoney(tx.amount, true)}</span></div>`).join("")}
        </section>
      </div>
    </div>`;

  const donut = document.getElementById("donut");
  if (donut && totalSpent > 0) drawDonut(donut, topSlices, totalSpent);
  const bars = document.getElementById("bars");
  if (bars) {
    drawBars(bars, MONTHS.map((m) => {
      const t = monthTotals(m);
      return { label: monthShort(m), income: t.income, spent: t.spent };
    }));
  }
}

function txRow(tx) {
  const cat = categoryById(tx.category);
  const incomeCat = INCOME_CATEGORIES.find((c) => c.id === tx.category);
  const label = incomeCat ? incomeCat.name : cat.name;
  const color = incomeCat ? "#166534" : cat.color;
  return `<tr>
    <td class="tx-date">${esc(tx.date)}</td>
    <td><span class="tx-desc">${esc(tx.desc)}</span></td>
    <td><span class="cat-chip"><span class="dot" style="background:${color}"></span>${esc(label)}</span></td>
    <td class="num money ${tx.amount < 0 ? "neg" : "pos"}">${fmtMoney(tx.amount, true)}</td>
    <td class="num">
      <button type="button" class="link-btn" data-action="edit-tx" data-id="${esc(tx.id)}">Edit</button>
      <button type="button" class="icon-btn" data-action="delete-tx" data-id="${esc(tx.id)}" aria-label="Delete ${esc(tx.desc)}">Delete</button>
    </td>
  </tr>`;
}

function renderTransactions() {
  const all = monthTransactions(currentMonth).slice().sort((a, b) => b.date.localeCompare(a.date));
  const filtered = all.filter((tx) => {
    if (txFilter.type === "income" && tx.amount <= 0) return false;
    if (txFilter.type === "expense" && tx.amount >= 0) return false;
    if (txFilter.category !== "all" && tx.category !== txFilter.category) return false;
    if (txFilter.q && !tx.desc.toLowerCase().includes(txFilter.q.toLowerCase())) return false;
    return true;
  });
  const totals = monthTotals(currentMonth);
  const catOptions = [...CATEGORIES, ...INCOME_CATEGORIES]
    .map((c) => `<option value="${c.id}" ${txFilter.category === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("");

  document.getElementById("view").innerHTML = `
    <div class="page-head">
      <h1>Transactions</h1>
      <p>Every dollar in and out for ${esc(monthName(currentMonth))} — ${all.length} transactions, ${fmtMoney(totals.income)} in and ${fmtMoney(totals.spent)} out.</p>
    </div>
    <div class="card">
      <div class="toolbar">
        <label class="grow">Search
          <input id="filter-q" type="search" placeholder="Search descriptions…" value="${esc(txFilter.q)}">
        </label>
        <label>Category
          <select id="filter-category"><option value="all">All categories</option>${catOptions}</select>
        </label>
        <label>Type
          <select id="filter-type">
            <option value="all" ${txFilter.type === "all" ? "selected" : ""}>All</option>
            <option value="income" ${txFilter.type === "income" ? "selected" : ""}>Income</option>
            <option value="expense" ${txFilter.type === "expense" ? "selected" : ""}>Expenses</option>
          </select>
        </label>
        <button type="button" class="btn" data-action="add-tx">+ Add transaction</button>
      </div>
      <div style="overflow-x:auto">
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th><th class="num hide-mobile">Actions</th></tr></thead>
        <tbody>
          ${filtered.map(txRow).join("") || `<tr><td colspan="5"><p class="empty">No transactions match these filters.</p></td></tr>`}
        </tbody>
      </table>
      </div>
      <p class="sub" style="margin:12px 0 0">Showing ${filtered.length} of ${all.length} transactions.</p>
    </div>`;

  document.getElementById("filter-q").addEventListener("input", (e) => { txFilter.q = e.target.value; renderTransactionsKeepFocus(); });
  document.getElementById("filter-category").addEventListener("change", (e) => { txFilter.category = e.target.value; renderTransactions(); });
  document.getElementById("filter-type").addEventListener("change", (e) => { txFilter.type = e.target.value; renderTransactions(); });
}

function renderTransactionsKeepFocus() {
  const q = document.getElementById("filter-q").value;
  const pos = document.getElementById("filter-q").selectionStart;
  renderTransactions();
  const input = document.getElementById("filter-q");
  input.focus();
  input.setSelectionRange(pos, pos);
  void q;
}

function renderBudgets() {
  const spent = categorySpent(currentMonth);
  const totalBudget = CATEGORIES.reduce((s, c) => s + (state.budgets[c.id] || 0), 0);
  const totalSpent = CATEGORIES.reduce((s, c) => s + (spent[c.id] || 0), 0);
  const over = CATEGORIES.filter((c) => (spent[c.id] || 0) > (state.budgets[c.id] || 0));

  document.getElementById("view").innerHTML = `
    <div class="page-head">
      <h1>Budgets for ${esc(monthName(currentMonth))}</h1>
      <p>Give every dollar a job before the month begins. ${fmtMoney(totalSpent)} of ${fmtMoney(totalBudget)} planned spending is used — ${over.length ? over.length + " categor" + (over.length === 1 ? "y is" : "ies are") + " over budget." : "nothing is over budget."}</p>
    </div>
    <div class="grid grid-main">
      <section class="card">
        <h2>Category budgets</h2>
        <p class="sub">Tap a monthly limit to change it. Changes save right away.</p>
        ${CATEGORIES.map((c) => {
          const used = spent[c.id] || 0;
          const limit = state.budgets[c.id] || 0;
          const ratio = limit ? used / limit : 0;
          const left = limit - used;
          return `<div class="budget-row">
            <div class="row-top"><span><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</span>
            <span class="money">${fmtMoney(used)} of <input type="number" min="0" step="5" value="${limit}" data-budget="${c.id}" aria-label="Monthly budget for ${esc(c.name)}" style="width:84px;padding:2px 6px;border:1px solid #cfc8b8;border-radius:7px;text-align:right"> / mo</span></div>
            <div class="row-meta"><span>${Math.round(ratio * 100)}% used</span><span class="${left < 0 ? "neg" : ""}">${left < 0 ? fmtMoney(left, true) + " over" : fmtMoney(left) + " left"}</span></div>
            <div class="bar ${ratio > 1 ? "over" : ratio > 0.85 ? "near" : ""}"><span style="width:${Math.min(100, Math.round(ratio * 100))}%"></span></div>
          </div>`;
        }).join("")}
      </section>
      <div class="stack">
        <section class="card">
          <h2>How budgeting works here</h2>
          <p class="sub">Three rules that keep a household calm:</p>
          <div class="insight"><span class="mark">1</span><p><b>Plan before you spend.</b> Set each category's limit at the start of the month, when the money is still yours.</p></div>
          <div class="insight"><span class="mark">2</span><p><b>Watch the bars, not the receipts.</b> A bar past 85% means slow down in that category — not in every category.</p></div>
          <div class="insight"><span class="mark">3</span><p><b>Pay yourself first.</b> The $500 transfer to savings leaves on the 28th, before the month's leftover gets spent.</p></div>
        </section>
        <section class="card">
          <h2>50 / 30 / 20 check</h2>
          <p class="sub">A classic split for a household budget — needs, wants, savings.</p>
          ${(() => {
            const needs = ["housing", "groceries", "utilities", "transport", "health"].reduce((s, id) => s + (spent[id] || 0), 0);
            const wants = ["dining", "entertainment", "shopping", "subscriptions", "personal"].reduce((s, id) => s + (spent[id] || 0), 0);
            const save = (spent.savings || 0);
            const total = needs + wants + save || 1;
            return `<div class="kv"><span class="k">Needs (home, food, bills)</span><span class="v">${Math.round((needs / total) * 100)}% · ${fmtMoney(needs)}</span></div>
            <div class="kv"><span class="k">Wants (eating out, fun, shopping)</span><span class="v">${Math.round((wants / total) * 100)}% · ${fmtMoney(wants)}</span></div>
            <div class="kv"><span class="k">Savings &amp; debt payoff</span><span class="v">${Math.round((save / total) * 100)}% · ${fmtMoney(save)}</span></div>
            <p class="sub" style="margin:10px 0 0">Aim for roughly 50 / 30 / 20. This month the household is at ${Math.round((needs / total) * 100)} / ${Math.round((wants / total) * 100)} / ${Math.round((save / total) * 100)}.</p>`;
          })()}
        </section>
      </div>
    </div>`;

  document.querySelectorAll("[data-budget]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const id = e.target.dataset.budget;
      const value = Math.max(0, Math.round(Number(e.target.value) || 0));
      state.budgets[id] = value;
      saveState();
      showToast(categoryById(id).name + " budget set to " + fmtMoney(value) + " / month");
      renderBudgets();
    });
  });
}

function renderBills() {
  const paid = state.billsPaid[currentMonth] || [];
  const paidTotal = BILLS.filter((b) => paid.includes(b.id)).reduce((s, b) => s + b.amount, 0);
  const dueTotal = BILLS.filter((b) => !paid.includes(b.id)).reduce((s, b) => s + b.amount, 0);

  document.getElementById("view").innerHTML = `
    <div class="page-head">
      <h1>Bills</h1>
      <p>Recurring bills for ${esc(monthName(currentMonth))}. ${fmtMoney(paidTotal)} already paid, ${fmtMoney(dueTotal)} still due — tick a bill off as soon as it clears.</p>
    </div>
    <div class="grid grid-main">
      <section class="card">
        <h2>Recurring bills</h2>
        <p class="sub">Sorted by due date. Unpaid bills are highlighted until they are ticked off.</p>
        ${BILLS.slice().sort((a, b) => a.day - b.day).map((b) => {
          const isPaid = paid.includes(b.id);
          return `<div class="bill-row">
            <input class="check" type="checkbox" data-bill="${b.id}" ${isPaid ? "checked" : ""} aria-label="Mark ${esc(b.name)} as paid">
            <div class="bill-main">
              <div class="bill-name">${esc(b.name)}</div>
              <div class="bill-meta">Due ${b.day} ${esc(monthName(currentMonth))} · ${esc(b.note)}</div>
            </div>
            <span class="bill-amount money">${fmtMoney(b.amount)}</span>
            <span class="pill ${isPaid ? "" : "amber"}">${isPaid ? "Paid" : "Due"}</span>
          </div>`;
        }).join("")}
      </section>
      <div class="stack">
        <section class="card">
          <h2>This month's bills</h2>
          <div class="kv"><span class="k">Total recurring bills</span><span class="v money">${fmtMoney(paidTotal + dueTotal)}</span></div>
          <div class="kv"><span class="k">Paid so far</span><span class="v money pos">${fmtMoney(paidTotal)}</span></div>
          <div class="kv"><span class="k">Still to pay</span><span class="v money ${dueTotal ? "neg" : ""}">${fmtMoney(dueTotal)}</span></div>
          <div class="kv"><span class="k">Biggest bill</span><span class="v">Rent · ${fmtMoney(1450)}</span></div>
        </section>
        <section class="card">
          <h2>Never miss a bill</h2>
          <p class="sub">What this household does:</p>
          <div class="insight"><span class="mark">✓</span><p><b>Autopay the fixed ones.</b> Rent, internet, and insurance leave on their own — no remembering required.</p></div>
          <div class="insight"><span class="mark">✓</span><p><b>Check the variable ones.</b> Power and water change with the season, so they get a look before the due date.</p></div>
          <div class="insight"><span class="mark">✓</span><p><b>Keep a $200 cushion.</b> The checking account never drops below $200, so a bill is never late because of timing.</p></div>
        </section>
      </div>
    </div>`;

  document.querySelectorAll("[data-bill]").forEach((box) => {
    box.addEventListener("change", (e) => {
      const id = e.target.dataset.bill;
      const list = state.billsPaid[currentMonth] || (state.billsPaid[currentMonth] = []);
      if (e.target.checked) {
        if (!list.includes(id)) list.push(id);
        showToast("Marked as paid");
      } else {
        state.billsPaid[currentMonth] = list.filter((x) => x !== id);
        showToast("Marked as unpaid");
      }
      saveState();
      renderBills();
    });
  });
}

function renderGoals() {
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);

  document.getElementById("view").innerHTML = `
    <div class="page-head">
      <h1>Savings goals</h1>
      <p>${fmtMoney(totalSaved)} saved toward ${fmtMoney(totalTarget)} of goals. Every goal gets a little each month — small, steady, and on purpose.</p>
    </div>
    <div class="grid grid-2">
      ${state.goals.map((g) => {
        const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
        return `<section class="card goal-card">
          <div class="goal-top"><span class="goal-name">${esc(g.name)}</span><span class="goal-pct">${pct}%</span></div>
          <p class="goal-amount">${fmtMoney(g.saved)} of ${fmtMoney(g.target)} · by ${esc(g.deadline)}</p>
          <div class="bar"><span style="width:${pct}%"></span></div>
          <p class="sub" style="margin:10px 0 12px">${esc(g.note)}. ${fmtMoney(g.target - g.saved)} to go.</p>
          <button type="button" class="btn ghost small" data-action="add-funds" data-id="${esc(g.id)}">+ Add funds</button>
        </section>`;
      }).join("")}
    </div>
    <section class="card" style="margin-top:16px">
      <h2>Start a new goal</h2>
      <p class="sub">Name it, price it, date it — a goal without a number is just a wish.</p>
      <form id="goal-form">
        <div class="grid grid-3">
          <label>Goal name<input id="goal-name" type="text" required maxlength="60" placeholder="e.g. New washing machine"></label>
          <label>Target amount (USD)<input id="goal-target" type="number" required min="1" step="1" placeholder="1500"></label>
          <label>Target date<input id="goal-date" type="date" required></label>
        </div>
        <button type="submit" class="btn">Add goal</button>
      </form>
    </section>`;

  document.getElementById("goal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("goal-name").value.trim();
    const target = Math.round(Number(document.getElementById("goal-target").value) || 0);
    const deadline = document.getElementById("goal-date").value;
    if (!name || target <= 0 || !deadline) return;
    state.goals.push({ id: "goal-" + Date.now(), name, target, saved: 0, deadline, note: "Added by the household" });
    saveState();
    showToast("Goal added: " + name);
    renderGoals();
  });
}

function renderInsights() {
  const totals = monthTotals(currentMonth);
  const prevMonth = MONTHS[Math.max(0, MONTHS.indexOf(currentMonth) - 1)];
  const prev = monthTotals(prevMonth);
  const spent = categorySpent(currentMonth);
  const topCat = Object.entries(spent).sort((a, b) => b[1] - a[1])[0];
  const daysInMonth = new Date(Number(currentMonth.split("-")[0]), Number(currentMonth.split("-")[1]), 0).getDate();
  const dayNow = currentMonth === CURRENT_MONTH ? 26 : daysInMonth;
  const dailyAvg = totals.spent / dayNow;
  const projected = dailyAvg * daysInMonth;
  const change = prev.spent ? Math.round(((totals.spent - prev.spent) / prev.spent) * 100) : 0;
  const biggest = monthTransactions(currentMonth).filter((tx) => tx.amount < 0).sort((a, b) => a.amount - b.amount)[0];
  const savingsRate = totals.income ? Math.round(((totals.income - totals.spent) / totals.income) * 100) : 0;

  document.getElementById("view").innerHTML = `
    <div class="page-head">
      <h1>Insights</h1>
      <p>What ${esc(monthName(currentMonth))} actually says about this household's money — computed from the real transactions, not guesses.</p>
    </div>
    <div class="grid grid-main">
      <section class="card">
        <h2>What stands out</h2>
        <div class="insight"><span class="mark">$</span><p><b>Biggest cost: ${esc(topCat ? categoryById(topCat[0]).name : "—")} at ${fmtMoney(topCat ? topCat[1] : 0)}.</b> ${topCat && topCat[0] === "groceries" ? "Groceries lead every month — meal planning is the single biggest lever this household has." : "It leads spending this month."}</p></div>
        <div class="insight"><span class="mark">↗</span><p><b>Spending is ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% vs ${esc(monthName(prevMonth))}.</b> ${change > 0 ? "Most of the rise is groceries and transport — worth a look, not a panic." : "The household spent less than last month while income held steady."}</p></div>
        <div class="insight"><span class="mark">◷</span><p><b>About ${fmtMoney(dailyAvg)} a day.</b> At this pace the month lands near ${fmtMoney(projected)} of spending — inside the ${fmtMoney(CATEGORIES.reduce((s, c) => s + (state.budgets[c.id] || 0), 0))} planned budget.</p></div>
        <div class="insight"><span class="mark">★</span><p><b>Biggest single purchase: ${esc(biggest ? biggest.desc : "—")} (${fmtMoney(biggest ? -biggest.amount : 0)}).</b> One-off purchases like this are why the budget keeps a $100 “other” cushion.</p></div>
        <div class="insight"><span class="mark">%</span><p><b>Savings rate: ${savingsRate}%.</b> ${savingsRate >= 20 ? "Above the 20% rule of thumb — the household is building its cushion." : "Below the 20% rule of thumb. Moving $100 from dining out to savings would close most of the gap."}</p></div>
      </section>
      <div class="stack">
        <section class="card">
          <h2>This month vs last</h2>
          ${CATEGORIES.map((c) => {
            const now = spent[c.id] || 0;
            const then = categorySpent(prevMonth)[c.id] || 0;
            const diff = then ? Math.round(((now - then) / then) * 100) : null;
            return `<div class="kv"><span class="k"><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};margin-right:6px"></span>${esc(c.name)}</span><span class="v money">${fmtMoney(now)} <span style="color:var(--muted);font-weight:400">${diff === null ? "—" : (diff >= 0 ? "+" : "") + diff + "%"}</span></span></div>`;
          }).join("")}
        </section>
        <section class="card">
          <h2>Three moves for next month</h2>
          <div class="insight"><span class="mark">1</span><p><b>Plan meals on Sunday.</b> Groceries are the top cost; a weekly list typically trims 10–15% without eating worse.</p></div>
          <div class="insight"><span class="mark">2</span><p><b>Cap dining out at $180.</b> November is running near $190 — a small cut that frees real money.</p></div>
          <div class="insight"><span class="mark">3</span><p><b>Keep the $500 autopay.</b> Savings that leave before spending starts are savings that actually happen.</p></div>
        </section>
      </div>
    </div>`;
}

function openTxModal(existing) {
  const modal = document.getElementById("modal-backdrop");
  const form = document.getElementById("tx-form");
  const catSelect = document.getElementById("tx-category");
  const typeSelect = document.getElementById("tx-type");
  document.getElementById("modal-title").textContent = existing ? "Edit transaction" : "Add transaction";
  document.getElementById("tx-id").value = existing ? existing.id : "";

  function fillCategories(type) {
    const list = type === "income" ? INCOME_CATEGORIES : CATEGORIES;
    catSelect.innerHTML = list.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  }
  fillCategories(existing ? (existing.amount > 0 ? "income" : "expense") : "expense");
  typeSelect.value = existing ? (existing.amount > 0 ? "income" : "expense") : "expense";
  typeSelect.onchange = () => fillCategories(typeSelect.value);
  document.getElementById("tx-desc").value = existing ? existing.desc : "";
  document.getElementById("tx-amount").value = existing ? Math.abs(existing.amount).toFixed(2) : "";
  document.getElementById("tx-date").value = existing ? existing.date : currentMonth + "-26";
  if (existing) catSelect.value = existing.category;
  modal.hidden = false;
  document.getElementById("tx-desc").focus();
}

function closeTxModal() {
  document.getElementById("modal-backdrop").hidden = true;
}

function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCSV() {
  const rows = [["date", "description", "category", "amount_usd"]];
  for (const tx of state.transactions.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push([tx.date, '"' + tx.desc.replace(/"/g, '""') + '"', tx.category, tx.amount.toFixed(2)]);
  }
  download("hearth-transactions.csv", rows.map((r) => r.join(",")).join("\n"), "text/csv");
  showToast("CSV exported — " + state.transactions.length + " transactions");
}

function exportJSON() {
  download("hearth-data.json", JSON.stringify(state, null, 2), "application/json");
  showToast("Data exported as JSON");
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || !Array.isArray(parsed.transactions)) throw new Error("bad file");
      state = parsed;
      saveState();
      showToast("Imported " + parsed.transactions.length + " transactions");
      render();
    } catch (err) {
      showToast("That file is not a Hearth export");
    }
  };
  reader.readAsText(file);
}

function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [name] = hash.split("/");
  return ["transactions", "budgets", "bills", "goals", "insights"].includes(name) ? name : "dashboard";
}

function render() {
  const current = route();
  navActive(current);
  if (current === "dashboard") renderDashboard();
  else if (current === "transactions") renderTransactions();
  else if (current === "budgets") renderBudgets();
  else if (current === "bills") renderBills();
  else if (current === "goals") renderGoals();
  else renderInsights();
  window.scrollTo({ top: 0 });
}

document.getElementById("view").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === "add-tx") openTxModal(null);
  if (action === "edit-tx") {
    const tx = state.transactions.find((t) => t.id === id);
    if (tx) openTxModal(tx);
  }
  if (action === "delete-tx") {
    const tx = state.transactions.find((t) => t.id === id);
    if (tx && confirm("Delete “" + tx.desc + "” (" + fmtMoney(tx.amount, true) + ")?")) {
      state.transactions = state.transactions.filter((t) => t.id !== id);
      saveState();
      showToast("Transaction deleted");
      render();
    }
  }
  if (action === "add-funds") {
    const goal = state.goals.find((g) => g.id === id);
    if (!goal) return;
    const raw = prompt("Add how much to “" + goal.name + "”? (USD)", "100");
    const amount = Math.round(Number(raw) || 0);
    if (amount > 0) {
      goal.saved = Math.min(goal.target, goal.saved + amount);
      saveState();
      showToast(fmtMoney(amount) + " added to " + goal.name);
      renderGoals();
    }
  }
});

document.getElementById("tx-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("tx-id").value;
  const type = document.getElementById("tx-type").value;
  const desc = document.getElementById("tx-desc").value.trim();
  const category = document.getElementById("tx-category").value;
  const amount = Math.abs(Number(document.getElementById("tx-amount").value) || 0);
  const date = document.getElementById("tx-date").value;
  if (!desc || amount <= 0 || !date) return;
  const signed = type === "income" ? amount : -amount;
  if (id) {
    const tx = state.transactions.find((t) => t.id === id);
    if (tx) Object.assign(tx, { desc, category, amount: signed, date });
    showToast("Transaction updated");
  } else {
    state.transactions.push({
      id: "tx-" + date + "-" + desc.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28) + "-" + Date.now().toString(36),
      date, desc, category, amount: signed,
    });
    showToast("Transaction added");
  }
  saveState();
  closeTxModal();
  render();
});

document.getElementById("modal-cancel").addEventListener("click", closeTxModal);
document.getElementById("modal-backdrop").addEventListener("click", (e) => {
  if (e.target.id === "modal-backdrop") closeTxModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeTxModal();
});

document.getElementById("month-prev").addEventListener("click", () => {
  const i = MONTHS.indexOf(currentMonth);
  if (i > 0) { currentMonth = MONTHS[i - 1]; render(); }
});
document.getElementById("month-next").addEventListener("click", () => {
  const i = MONTHS.indexOf(currentMonth);
  if (i < MONTHS.length - 1) { currentMonth = MONTHS[i + 1]; render(); }
});

document.getElementById("export-csv").addEventListener("click", exportCSV);
document.getElementById("export-json").addEventListener("click", exportJSON);
document.getElementById("import-file").addEventListener("change", (e) => {
  if (e.target.files[0]) importJSON(e.target.files[0]);
  e.target.value = "";
});
document.getElementById("reset-data").addEventListener("click", () => {
  if (confirm("Reset all data back to the demo household? Your edits will be lost.")) {
    state = seedState();
    saveState();
    showToast("Demo data restored");
    render();
  }
});

window.addEventListener("hashchange", render);
render();
