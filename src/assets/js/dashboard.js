import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

// ======================================================
// Elements
// ======================================================

const usernameElement = document.querySelector("#headerUsername");

const ctxCircle = document.querySelector(".incomeChart");
const ctxLine = document.querySelector(".processChart");

const totalBalance = document.querySelector(".total-balance");
const incomeBalance = document.querySelector(".income-balance");
const expenseBalance = document.querySelector(".expense-balance");

const transactionBody = document.getElementById("transactionBody");
const budgetList = document.getElementById("budgetList");

// ======================================================
// Username
// ======================================================

const username = localStorage.getItem("userName");

if (usernameElement) {
  usernameElement.textContent = username || "کاربر";
}

// ======================================================
// Token
// ======================================================

const token = localStorage.getItem("token");

if (!token) {
  showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");
}

// ======================================================
// Data
// ======================================================

let categories = [];
let transactions = [];
let budgets = [];
let dashboardData = null;

let circleChart = null;
let lineChart = null;

// ======================================================
// Base Currency
// ======================================================

let baseCurrency = "";

// ======================================================
// Load Base Currency
// ======================================================

async function loadBaseCurrency() {
  try {
    const response = await api.get("/profile");

    console.log("========== PROFILE ==========");
    console.log("Profile response:", response.data);

    const profile =
      response.data?.data?.profile ||
      response.data?.data ||
      response.data?.profile ||
      response.data;

    console.log("Profile object:", profile);

    // ==================================================
    // Find currency_id
    // ==================================================

    const currencyId =
      profile?.currency_id ??
      profile?.currencyId ??
      profile?.currency?.id ??
      profile?.currency?.currency_id;

    console.log("Profile currency_id:", currencyId);

    // ==================================================
    // If currency_id exists
    // ==================================================

    if (currencyId !== null && currencyId !== undefined && currencyId !== "") {
      await loadCurrencyById(currencyId);
      return;
    }

    // ==================================================
    // If currency is object
    // ==================================================

    if (profile?.currency && typeof profile.currency === "object") {
      baseCurrency =
        profile.currency.symbol ||
        profile.currency.currency_symbol ||
        profile.currency.currencySymbol ||
        profile.currency.code ||
        "";

      if (baseCurrency) {
        console.log("✅ Base Currency Symbol From Profile:", baseCurrency);

        return;
      }
    }

    // ==================================================
    // If currency is string
    // ==================================================

    if (typeof profile?.currency === "string" && profile.currency.trim()) {
      baseCurrency = profile.currency.trim();

      console.log("Base Currency From Profile String:", baseCurrency);

      return;
    }

    // ==================================================
    // currency_symbol
    // ==================================================

    if (profile?.currency_symbol) {
      baseCurrency = profile.currency_symbol;

      console.log("Base Currency From currency_symbol:", baseCurrency);

      return;
    }

    // ==================================================
    // currency_code
    // ==================================================

    if (profile?.currency_code) {
      baseCurrency = profile.currency_code;

      console.log("Base Currency From currency_code:", baseCurrency);

      return;
    }

    console.warn("⚠️ سمبل ارز پایه در پروفایل پیدا نشد.");
  } catch (error) {
    console.error("خطا در دریافت ارز پایه:", error);
  }
}

// ======================================================
// Load Currency By ID
// ======================================================

async function loadCurrencyById(currencyId) {
  try {
    console.log("در حال دریافت ارز با ID:", currencyId);

    const response = await api.get("/currencies");

    console.log("Currencies response:", response.data);

    const currencies =
      response.data?.data?.currencies ||
      response.data?.data ||
      response.data?.currencies ||
      [];

    if (!Array.isArray(currencies)) {
      console.error("لیست ارزها معتبر نیست:", currencies);

      return;
    }

    const currency = currencies.find(
      (item) =>
        Number(item.id) === Number(currencyId) ||
        Number(item.currency_id) === Number(currencyId),
    );

    console.log("Selected currency:", currency);

    if (!currency) {
      console.error("ارز پایه پیدا نشد:", currencyId);

      return;
    }

    // ==================================================
    // فقط Symbol
    // ==================================================

    baseCurrency =
      currency.symbol ||
      currency.currency_symbol ||
      currency.currencySymbol ||
      "";

    console.log("✅ Base Currency Symbol:", baseCurrency);
  } catch (error) {
    console.error("خطا در دریافت ارزها:", error);
  }
}

// ======================================================
// Format Number
// ======================================================

function formatNumber(number) {
  const value = Number(number) || 0;

  return Math.abs(value).toLocaleString("en-US");
}

// ======================================================
// Format Money
// ======================================================

function formatMoney(number) {
  const value = Number(number) || 0;

  const formatted = formatNumber(value);

  // اگر سمبل ارز پیدا نشده باشد
  if (!baseCurrency) {
    return value < 0 ? `-${formatted}` : formatted;
  }

  // هزینه
  if (value < 0) {
    return `-${formatted} ${baseCurrency}`;
  }

  // درآمد / موجودی مثبت
  return `${formatted} ${baseCurrency}`;
}

// ======================================================
// Animate Numbers
// ======================================================

function animateNumber(element, target, duration = 1500) {
  if (!element) {
    return;
  }

  const numericTarget = Number(target) || 0;

  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);

    const currentValue = numericTarget * progress;

    element.textContent = formatMoney(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ======================================================
// Category Helpers
// ======================================================

function getParentId(category) {
  if (!category) {
    return null;
  }

  if (
    category.parent_id !== undefined &&
    category.parent_id !== null &&
    category.parent_id !== ""
  ) {
    return category.parent_id;
  }

  if (
    category.parentId !== undefined &&
    category.parentId !== null &&
    category.parentId !== ""
  ) {
    return category.parentId;
  }

  return null;
}

// ======================================================
// Find Category By ID
// ======================================================

function findCategoryById(categoryId) {
  if (categoryId === null || categoryId === undefined || categoryId === "") {
    return null;
  }

  const id = String(categoryId);

  for (const category of categories) {
    if (String(category.id) === id) {
      return category;
    }

    if (Array.isArray(category.children)) {
      const child = category.children.find((item) => String(item.id) === id);

      if (child) {
        return child;
      }
    }
  }

  return null;
}

// ======================================================
// Transaction Helpers
// ======================================================

function getTransactionTitle(transaction) {
  return (
    transaction.title ||
    transaction.description ||
    transaction.name ||
    "بدون عنوان"
  );
}

function getTransactionAmount(transaction) {
  return Number(transaction.amount) || 0;
}

function getTransactionType(transaction) {
  return transaction.type || "expense";
}

function getTransactionCategoryId(transaction) {
  return (
    transaction.category_id ||
    transaction.categoryId ||
    transaction.category?.id ||
    ""
  );
}

// ======================================================
// Transaction Category Name
// ======================================================

function getTransactionCategoryName(transaction) {
  if (transaction.category?.name) {
    return transaction.category.name;
  }

  if (transaction.category_name) {
    return transaction.category_name;
  }

  if (typeof transaction.category === "string") {
    return transaction.category;
  }

  const categoryId = getTransactionCategoryId(transaction);

  if (!categoryId) {
    return "بدون دسته";
  }

  const category = findCategoryById(categoryId);

  if (category) {
    return category.name;
  }

  return "بدون دسته";
}

// ======================================================
// Tags
// ======================================================

function normalizeTag(tag) {
  if (tag === null || tag === undefined || tag === "") {
    return "";
  }

  const value = String(tag).trim().toLowerCase();

  const tagMap = {
    daily: "روزانه",
    روزانه: "روزانه",

    necessary: "ضروری",
    essential: "ضروری",
    important: "ضروری",
    ضروری: "ضروری",

    work: "کار",
    job: "کار",
    کار: "کار",
  };

  return tagMap[value] || String(tag).trim();
}

// ======================================================
// Transaction Tag
// ======================================================

function getTransactionTag(transaction) {
  if (!transaction?.id) {
    return "";
  }

  const savedTags = JSON.parse(localStorage.getItem("transactionTags") || "{}");

  const savedTag = savedTags[String(transaction.id)] || "";

  return normalizeTag(savedTag);
}

// ======================================================
// Transaction Date
// ======================================================

function getTransactionDate(transaction) {
  const date = transaction.created_at || transaction.transaction_date || "";

  if (!date) {
    return "";
  }

  return String(date).split(" ")[0].split("T")[0];
}

// ======================================================
// GET Categories
// ======================================================

async function getCategories() {
  try {
    const response = await api.get("/categories");

    categories =
      response.data?.data?.categories || response.data?.categories || [];

    if (!Array.isArray(categories)) {
      categories = [];
    }

    console.log("Categories:", categories);
  } catch (error) {
    console.error("Categories Error:", error);

    showToast(
      error.response?.data?.message || "دسته‌بندی‌ها دریافت نشدند.",
      "error",
    );
  }
}

// ======================================================
// POST Dashboard
// ======================================================

async function getDashboard() {
  const walletId = localStorage.getItem("walletId");

  if (!walletId) {
    showToast("کیف پول انتخاب نشده است.", "error");

    return;
  }

  const currentDate = new Date();

  const year = currentDate.getFullYear();

  const month = currentDate.getMonth() + 1;

  const formattedMonth = `${year}-${String(month).padStart(2, "0")}`;

  const formData = new FormData();

  formData.append("wallet_id", Number(walletId));

  formData.append("month", formattedMonth);

  formData.append("months", 6);

  try {
    const response = await api.post("/dashboard", formData);

    console.log("========== DASHBOARD ==========");

    console.log("Dashboard response:", response.data);

    dashboardData = response.data?.data || null;

    renderDashboardCards();
    renderExpenseChart();
    renderTrendChart();
    renderTopExpenseText();
  } catch (error) {
    console.error("Dashboard error:", error);

    showToast(
      error.response?.data?.message || "اطلاعات داشبورد دریافت نشد.",
      "error",
    );
  }
}

// ======================================================
// Dashboard Cards
// ======================================================

function renderDashboardCards() {
  const cards = dashboardData?.cards;

  if (!cards) {
    console.warn("Cards در پاسخ داشبورد وجود ندارد.");

    return;
  }

  console.log("========== DASHBOARD CARDS ==========");

  console.log("Total Balance:", cards.total_balance);

  console.log("Monthly Income:", cards.monthly_income);

  console.log("Monthly Expense:", cards.monthly_expense);

  // ==================================================
  // موجودی کل
  // ==================================================

  animateNumber(totalBalance, Number(cards.total_balance) || 0);

  // ==================================================
  // درآمد
  // ==================================================

  animateNumber(incomeBalance, Math.abs(Number(cards.monthly_income) || 0));

  // ==================================================
  // هزینه
  // ==================================================

  animateNumber(expenseBalance, -Math.abs(Number(cards.monthly_expense) || 0));
}

// ======================================================
// Top Expense Text
// ======================================================

function renderTopExpenseText() {
  const chartText = document.querySelector(".chart-text");

  if (!chartText) {
    return;
  }

  const top = dashboardData?.top_expense_category;

  if (!top) {
    chartText.textContent = "در این ماه هزینه‌ای ثبت نشده است.";

    return;
  }

  chartText.textContent = `بیشترین هزینه مربوط به ${top.category_name} بوده است.`;
}

// ======================================================
// Expense Doughnut Chart
// ======================================================

function renderExpenseChart() {
  if (!ctxCircle) {
    return;
  }

  const expenseCategories = dashboardData?.expense_categories || [];

  if (circleChart) {
    circleChart.destroy();
  }

  let labels = [];
  let data = [];

  expenseCategories.forEach((item) => {
    labels.push(item.category_name);

    data.push(Math.abs(Number(item.amount) || 0));
  });

  if (!data.length) {
    labels = ["هزینه‌ای نیست"];

    data = [1];
  }

  circleChart = new Chart(ctxCircle, {
    type: "doughnut",

    data: {
      labels: labels,

      datasets: [
        {
          data: data,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: true,

      plugins: {
        legend: {
          labels: {
            font: {
              size: 14,
              family: "VazirMatn",
            },
          },
        },
      },
    },
  });
}

// ======================================================
// Convert Month
// ======================================================

function getPersianMonth(dateString) {
  if (!dateString) {
    return "";
  }

  const month = Number(String(dateString).split("-")[1]);

  const months = {
    1: "فروردین",
    2: "اردیبهشت",
    3: "خرداد",
    4: "تیر",
    5: "مرداد",
    6: "شهریور",
    7: "مهر",
    8: "آبان",
    9: "آذر",
    10: "دی",
    11: "بهمن",
    12: "اسفند",
  };

  return months[month] || dateString;
}

// ======================================================
// Trend Chart
// ======================================================

function renderTrendChart() {
  if (!ctxLine) {
    return;
  }

  const trend = dashboardData?.trend || [];

  if (lineChart) {
    lineChart.destroy();
  }

  const labels = trend.map((item) => getPersianMonth(item.month));

  // درآمد همیشه مثبت
  const incomeData = trend.map((item) => Math.abs(Number(item.income) || 0));

  // هزینه برای نمودار مثبت
  const expenseData = trend.map((item) => Math.abs(Number(item.expense) || 0));

  lineChart = new Chart(ctxLine, {
    type: "line",

    data: {
      labels: labels,

      datasets: [
        {
          label: "درآمد",

          data: incomeData,

          borderWidth: 2,

          tension: 0.4,
        },

        {
          label: "هزینه",

          data: expenseData,

          borderWidth: 2,

          tension: 0.4,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          labels: {
            font: {
              size: 14,
              family: "VazirMatn",
            },
          },
        },
      },

      scales: {
        x: {
          ticks: {
            font: {
              size: 10,
              family: "VazirMatn",
            },
          },
        },

        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// ======================================================
// GET Transactions
// ======================================================

async function getTransactions() {
  try {
    const response = await api.get("/transactions");

    transactions =
      response.data?.data?.transactions || response.data?.transactions || [];

    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    console.log("Transactions:", transactions);

    renderLatestTransactions();
  } catch (error) {
    console.error("Transactions Error:", error);

    showToast(
      error.response?.data?.message || "تراکنش‌ها دریافت نشدند.",
      "error",
    );
  }
}

// ======================================================
// Sort Latest Transactions
// ======================================================

function sortLatestTransactions(transactionList) {
  return [...transactionList].sort((a, b) => {
    const dateA = new Date(getTransactionDate(a));

    const dateB = new Date(getTransactionDate(b));

    return dateB - dateA;
  });
}

// ======================================================
// Render Latest Transactions
// ======================================================

function renderLatestTransactions() {
  if (!transactionBody) {
    return;
  }

  transactionBody.innerHTML = "";

  if (!transactions.length) {
    transactionBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="no-result"
          style="color: var(--very-pink)"
        >
          تراکنشی ثبت نشده است.
        </td>
      </tr>
    `;

    return;
  }

  const latestTransactions = sortLatestTransactions(transactions).slice(0, 3);

  latestTransactions.forEach((transaction, index) => {
    const title = getTransactionTitle(transaction);

    const amount = getTransactionAmount(transaction);

    const type = getTransactionType(transaction);

    const categoryName = getTransactionCategoryName(transaction);

    const tag = getTransactionTag(transaction);

    const date = getTransactionDate(transaction);

    // هزینه منفی
    // درآمد مثبت

    const displayAmount =
      type === "expense" ? -Math.abs(amount) : Math.abs(amount);

    const row = document.createElement("tr");

    row.innerHTML = `
        <td class="listId">
          ${index + 1}
        </td>

        <td>
          ${title}
        </td>

        <td>
          ${categoryName}
        </td>

        <td>
          ${formatMoney(displayAmount)}
        </td>

        <td>
          ${tag || "—"}
        </td>

        <td>
          ${date || "—"}
        </td>
      `;

    transactionBody.appendChild(row);
  });
}

// ======================================================
// GET Budgets
// ======================================================

async function getBudgets() {
  try {
    const walletId = localStorage.getItem("walletId");

    if (!walletId) {
      showToast("کیف پول انتخاب نشده است.", "error");

      return;
    }

    const currentDate = new Date();

    const year = currentDate.getFullYear();

    const month = currentDate.getMonth() + 1;

    const response = await api.get(`/budgets?wallet_id=${walletId}`, {
      params: {
        year: year,
        month: month,
      },
    });

    budgets = response.data?.data?.budgets || response.data?.budgets || [];

    if (!Array.isArray(budgets)) {
      budgets = [];
    }

    renderDashboardBudgets();
  } catch (error) {
    console.error("Budgets Error:", error);

    showToast(
      error.response?.data?.message || "بودجه‌ها دریافت نشدند.",
      "error",
    );
  }
}

// ======================================================
// Budget Icon
// ======================================================

function getBudgetIcon(categoryName) {
  let icon = "fa-wallet";

  const categoryText = String(categoryName || "").toLowerCase();

  if (categoryText.includes("غذا") || categoryText.includes("خوراک")) {
    icon = "fa-utensils";
  } else if (categoryText.includes("حمل") || categoryText.includes("نقل")) {
    icon = "fa-car";
  } else if (categoryText.includes("خرید")) {
    icon = "fa-shopping-bag";
  } else if (
    categoryText.includes("تفریح") ||
    categoryText.includes("سرگرمی")
  ) {
    icon = "fa-gamepad";
  }

  return icon;
}

// ======================================================
// Render Dashboard Budgets
// ======================================================

function renderDashboardBudgets() {
  if (!budgetList) {
    return;
  }

  budgetList.innerHTML = "";

  if (!budgets.length) {
    budgetList.innerHTML = `
      <p class="empty-budget">
        برای این ماه بودجه‌ای ثبت نشده است.
      </p>
    `;

    return;
  }

  budgets.forEach((budget) => {
    createDashboardBudget(budget);
  });
}

// ======================================================
// Create Dashboard Budget
// ======================================================

function createDashboardBudget(budget) {
  const categoryName =
    budget.category?.name ||
    budget.category_name ||
    findCategoryById(budget.category?.id || budget.category_id)?.name ||
    "بدون دسته‌بندی";

  const total = Number(budget.budget_amount) || 0;

  const spent = Number(budget.spent_amount) || 0;

  let percentage = total > 0 ? (spent / total) * 100 : 0;

  if (percentage > 100) {
    percentage = 100;
  }

  if (percentage < 0) {
    percentage = 0;
  }

  const icon = getBudgetIcon(categoryName);

  const budgetElement = document.createElement("div");

  budgetElement.className = "budget";

  budgetElement.innerHTML = `
    <div class="budget-info">
      <span>
        ${categoryName}
      </span>

      <span>
        ${Math.round(percentage)}٪
      </span>
    </div>

    <div class="progress">
      <span></span>
    </div>
  `;

  budgetList.appendChild(budgetElement);

  const progress = budgetElement.querySelector(".progress span");

  if (progress) {
    progress.style.backgroundColor = percentage >= 80 ? "#e85d75" : "#6d28d9";

    progress.style.width = "0%";

    setTimeout(() => {
      progress.style.width = `${percentage}%`;
    }, 100);
  }
}

// ======================================================
// Initial Load
// ======================================================

async function initDashboard() {
  try {
    // -----------------------------------------------
    // اول ارز پایه
    // -----------------------------------------------

    await loadBaseCurrency();

    console.log("💰 Final Base Currency:", baseCurrency);

    // -----------------------------------------------
    // دسته‌بندی‌ها
    // -----------------------------------------------

    await getCategories();

    // -----------------------------------------------
    // Dashboard
    // -----------------------------------------------

    await getDashboard();

    // -----------------------------------------------
    // Transactions + Budgets
    // -----------------------------------------------

    await Promise.all([getTransactions(), getBudgets()]);
  } catch (error) {
    console.error("INITIAL DASHBOARD ERROR:", error);

    showToast(
      error?.response?.data?.message ||
        error?.message ||
        "خطایی در دریافت اطلاعات داشبورد رخ داد.",
      "error",
    );
  }
}

// ======================================================
// Init
// ======================================================

initDashboard();
