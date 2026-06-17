

// Summary cards
const totalIncomeEl   = document.getElementById("totalIncome");
const totalExpenseEl  = document.getElementById("totalExpense");
const totalBalanceEl  = document.getElementById("totalBalance");

// Form inputs
const descInput       = document.getElementById("description");
const amountInput     = document.getElementById("amount");
const categorySelect  = document.getElementById("category");
const addBtn          = document.getElementById("addBtn");

// Income / Expense toggle buttons
const incomeBtn       = document.getElementById("incomeBtn");
const expenseBtn      = document.getElementById("expenseBtn");

// Transaction list + empty state
const transactionList = document.getElementById("transactionList");
const emptyState      = document.getElementById("emptyState");

// Filters
const filterCategory  = document.getElementById("filterCategory");
const filterType      = document.getElementById("filterType");
const clearAllBtn     = document.getElementById("clearAllBtn");

// Dark mode
const darkToggle      = document.getElementById("darkToggle");

// ── 2. LOAD SAVED DATA ────────────────────

// Load transactions from localStorage
// If nothing saved yet — start with empty array
let transactions = JSON.parse(
  localStorage.getItem("transactions") || "[]"
);

// Default selected type is income
let selectedType = "income";

// ── 3. DARK MODE ──────────────────────────

// Restore saved theme when page loads
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  darkToggle.innerText = "☀️";
}

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  darkToggle.innerText = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ── 4. INCOME / EXPENSE TOGGLE ────────────

incomeBtn.addEventListener("click",  () => setType("income"));
expenseBtn.addEventListener("click", () => setType("expense"));

function setType(type) {
  selectedType = type;

  // Add active class to selected, remove from other
  incomeBtn.classList.toggle("active",  type === "income");
  expenseBtn.classList.toggle("active", type === "expense");
}

// ── 5. CATEGORY ICONS ─────────────────────

// Maps each category value to an emoji icon
const categoryIcons = {
  food:      "🍔",
  transport: "🚗",
  shopping:  "🛍️",
  bills:     "💡",
  health:    "💊",
  salary:    "💼",
  other:     "📦",
};

// ── 6. FORM VALIDATION ────────────────────

function validateForm() {
  let isValid = true;

  // ── Check description ──────────────────
  if (descInput.value.trim() === "") {
    descInput.classList.add("error");
    document.getElementById("descError").classList.add("show");
    isValid = false;
  } else {
    descInput.classList.remove("error");
    document.getElementById("descError").classList.remove("show");
  }

  // ── Check amount ───────────────────────
  const amt = parseFloat(amountInput.value);
  if (!amountInput.value || isNaN(amt) || amt <= 0) {
    amountInput.classList.add("error");
    document.getElementById("amountError").classList.add("show");
    isValid = false;
  } else {
    amountInput.classList.remove("error");
    document.getElementById("amountError").classList.remove("show");
  }

  return isValid;
}

// Clear errors as user types — live feedback
descInput.addEventListener("input", () => {
  if (descInput.value.trim() !== "") {
    descInput.classList.remove("error");
    document.getElementById("descError").classList.remove("show");
  }
});

amountInput.addEventListener("input", () => {
  const amt = parseFloat(amountInput.value);
  if (amountInput.value && !isNaN(amt) && amt > 0) {
    amountInput.classList.remove("error");
    document.getElementById("amountError").classList.remove("show");
  }
});

// ── 7. ADD TRANSACTION ────────────────────

addBtn.addEventListener("click", addTransaction);

// Also allow pressing Enter in inputs to add
descInput.addEventListener("keydown",   e => { if (e.key === "Enter") addTransaction(); });
amountInput.addEventListener("keydown", e => { if (e.key === "Enter") addTransaction(); });

function addTransaction() {

  // Stop if validation fails
  if (!validateForm()) return;

  // Build transaction object
  const transaction = {
    id:          Date.now(),  // unique ID using timestamp
    description: descInput.value.trim(),
    amount:      parseFloat(amountInput.value),
    category:    categorySelect.value,
    type:        selectedType,
    date:        new Date().toLocaleDateString("en-US", {
                   month: "short",
                   day:   "numeric",
                   year:  "numeric",
                 }),
  };

  // Add to beginning of array so newest shows first
  transactions.unshift(transaction);

  // Save to localStorage
  saveData();

  // Clear the form inputs
  descInput.value   = "";
  amountInput.value = "";

  // Briefly animate the add button
  addBtn.innerText = "✓ Added!";
  setTimeout(() => addBtn.innerText = "+ Add Transaction", 1200);

  // Refresh the display
  render();
}

// ── 8. DELETE TRANSACTION ─────────────────

// Made global so onclick in HTML can reach it
window.deleteTransaction = function(id) {
  if (!confirm("Delete this transaction?")) return;

  // Filter out the transaction with this id
  transactions = transactions.filter(t => t.id !== id);

  saveData();
  render();
};

// ── 9. SAVE TO LOCALSTORAGE ───────────────

function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ── 10. UPDATE SUMMARY CARDS ──────────────

function updateSummary() {

  // Add up all income transactions
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Add up all expense transactions
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Balance = income minus expenses
  const balance = totalIncome - totalExpense;

  // Update the DOM
  totalIncomeEl.innerText  = `$${totalIncome.toFixed(2)}`;
  totalExpenseEl.innerText = `$${totalExpense.toFixed(2)}`;
  totalBalanceEl.innerText = `$${Math.abs(balance).toFixed(2)}`;

  // Show minus sign and red color if balance is negative
  if (balance < 0) {
    totalBalanceEl.innerText      = `-$${Math.abs(balance).toFixed(2)}`;
    totalBalanceEl.style.color    = "var(--rose)";
  } else {
    totalBalanceEl.style.color    = "var(--text-primary)";
  }
}

// ── 11. RENDER TRANSACTIONS ───────────────

function render() {

  // Read current filter values
  const catFilter  = filterCategory.value;
  const typeFilter = filterType.value;

  // Filter the transactions array based on selected filters
  const filtered = transactions.filter(t => {
    const catMatch  = catFilter  === "all" || t.category === catFilter;
    const typeMatch = typeFilter === "all" || t.type     === typeFilter;
    return catMatch && typeMatch;
  });

  // Show empty state if no transactions match
  if (filtered.length === 0) {
    emptyState.style.display      = "flex";
    transactionList.style.display = "none";
  } else {
    emptyState.style.display      = "none";
    transactionList.style.display = "flex";
  }

  // Build HTML for each transaction
  transactionList.innerHTML = "";

  filtered.forEach(t => {
    const icon   = categoryIcons[t.category] || "📦";
    const sign   = t.type === "income" ? "+" : "-";

    transactionList.insertAdjacentHTML("beforeend", `
      <div class="transaction-item ${t.type}">

        <div class="transaction-left">

          <div class="transaction-icon">${icon}</div>

          <div>
            <div class="transaction-desc">${t.description}</div>
            <div class="transaction-meta">${t.date} · ${t.category}</div>
          </div>

        </div>

        <div class="transaction-right">
          <span class="transaction-amount">
            ${sign}$${t.amount.toFixed(2)}
          </span>
          <button
            class="delete-btn"
            onclick="deleteTransaction(${t.id})"
            title="Delete transaction">
            🗑️
          </button>
        </div>

      </div>
    `);
  });

  // Always update the summary cards
  updateSummary();
}

// ── 12. FILTERS ───────────────────────────

// Re-render whenever a filter changes
filterCategory.addEventListener("change", render);
filterType.addEventListener("change",     render);

// ── 13. CLEAR ALL ─────────────────────────

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear ALL transactions? This cannot be undone!")) return;
  transactions = [];
  saveData();
  render();
});

// ── 14. STATS HELPER (BONUS) ──────────────

// You can call this in the console anytime to see your stats!
window.getStats = function() {
  const income  = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category
  const byCategory = {};
  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

  console.log("══════════════════════");
  console.log("YOUR EXPENSE STATS");
  console.log("══════════════════════");
  console.log(`Total Income:   $${income.toFixed(2)}`);
  console.log(`Total Expense:  $${expense.toFixed(2)}`);
  console.log(`Balance:        $${(income - expense).toFixed(2)}`);
  console.log(`Transactions:   ${transactions.length}`);
  console.log("──────────────────────");
  console.log("Spending by category:");
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      console.log(`   ${categoryIcons[cat]} ${cat}: $${amt.toFixed(2)}`);
    });
  console.log("══════════════════════");
};

// ── 15. START THE APP ─────────────────────

render();