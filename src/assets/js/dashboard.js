import api from "./api.js";
import { showToast } from "../../utils/Toast.js";
import "../../utils/notification.js";

// Elements
const usernameElement = document.querySelector("#headerUsername");
const ctxCircle = document.querySelector(".incomeChart");
const ctxLine = document.querySelector(".processChart");
const totalBalance = document.querySelector(".total-balance");
const incomeBalance = document.querySelector(".income-balance");
const expenseBalance = document.querySelector(".expense-balance");
const transactionBody = document.getElementById("transactionBody");
const budgetList = document.getElementById("budgetList");

// Username
const username = localStorage.getItem("userName");
if (usernameElement) {
  usernameElement.textContent = username || "کاربر";
}

// Token
const token = localStorage.getItem("token");
if (!token) {
  showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");
}

let categories = [];
let transactions = [];
let budgets = [];
let dashboardData = null;
let circleChart = null;
let lineChart = null;
let baseCurrency = "";

// Load Base Currency
async function loadBaseCurrency() {
  try {
    const response = await api.get("/profile");
    const profile = response.data.data.profile;

    // Find currency_id
    const currencyId = profile?.currency?.id;

    if (currencyId !== null && currencyId !== undefined && currencyId !== "") {
      await loadCurrencyById(currencyId);
      return;
    }

    if (profile?.currency && typeof profile.currency === "object") {
      baseCurrency = profile.currency.symbol || "";

      if (baseCurrency) return;
    }

    // If currency is string
    if (typeof profile?.currency === "string" && profile.currency.trim()) {
      baseCurrency = profile.currency.trim();
      return;
    }

    // currency_symbol
    if (profile?.currency_symbol) {
      baseCurrency = profile.currency_symbol;
      return;
    }
  } catch (error) {
    showToast("خطا در دریافت ارز پایه:");
  }
}

// Load Currency By ID
async function loadCurrencyById(currencyId) {
  try {
    const response = await api.get("/currencies");
    const currencies = response.data?.data?.currencies || [];

    if (!Array.isArray(currencies)) return;

    const currency = currencies.find(
      (item) => +item.id === +currencyId || +item.currency_id === +currencyId,
    );

    if (!currency) return;

    baseCurrency = currency.symbol || "";
  } catch (error) {
    showToast("خطا در دریافت ارزها:");
  }
}

// Format Money
function formatMoney(number) {
  const value = +number || 0;
  const formatted = Math.abs(value).toLocaleString("en-US");

  if (!baseCurrency) {
    return value < 0 ? `-${formatted}` : formatted;
  }

  if (value < 0) {
    return `-${formatted} ${baseCurrency}`;
  }

  return `${formatted} ${baseCurrency}`;
}

// Animate Numbers
function animateNumber(element, target, duration = 1500) {
  if (!element) {
    return;
  }

  const numericTarget = +target || 0;
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

// Category Helpers
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

// Find Category By ID
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

// Transaction Category Name
function getTransactionCategoryName(transaction) {
  if (transaction.category?.name) {
    return transaction.category.name;
  }

  const categoryId = transaction.category?.id || "";

  if (!categoryId) {
    return "بدون دسته";
  }

  const category = findCategoryById(categoryId);

  if (category) {
    return category.name;
  }

  return "بدون دسته";
}

// Transaction Tag
function getTransactionTag(transaction) {
  if (!transaction) {
    return "";
  }

  if (Array.isArray(transaction.tags) && transaction.tags.length) {
    const tag = transaction.tags[0];

    if (typeof tag === "object") {
      return tag.name || "";
    }

    return tag;
  }

  if (transaction.tag) {
    if (typeof transaction.tag === "object") {
      return transaction.tag.name || "";
    }

    return transaction.tag;
  }

  if (transaction.tag_name) {
    return transaction.tag_name;
  }

  if (Array.isArray(transaction.tag_names) && transaction.tag_names.length) {
    return transaction.tag_names[0];
  }

  return "";
}

// Transaction Date
function getTransactionDate(transaction) {
  const date = transaction.created_at || "";

  if (!date) {
    return "";
  }

  return String(date).split(" ")[0].split("T")[0];
}

// GET Categories
async function getCategories() {
  try {
    const response = await api.get("/categories");

    categories = response.data?.data?.categories || [];

    if (!Array.isArray(categories)) {
      categories = [];
    }
  } catch (error) {
    showToast(error.response?.data?.message || "دسته‌بندی‌ها دریافت نشدند.");
  }
}

// POST Dashboard
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
    dashboardData = response.data?.data || null;

    renderDashboardCards();
    renderExpenseChart();
    renderTrendChart();
    renderTopExpenseText();
  } catch (error) {
    showToast(
      error.response?.data?.message || "اطلاعات داشبورد دریافت نشد.",
      "error",
    );
  }
}

// Dashboard Cards
function renderDashboardCards() {
  const cards = dashboardData?.cards;

  if (!cards) return;
  // total balance
  animateNumber(totalBalance, Number(cards.total_balance) || 0);

  // income
  animateNumber(incomeBalance, Math.abs(Number(cards.monthly_income) || 0));

  // expense
  animateNumber(expenseBalance, -Math.abs(Number(cards.monthly_expense) || 0));
}

// Top Expense Text
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

// Expense Doughnut Chart
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

// Convert Month
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

// Trend Chart
function renderTrendChart() {
  if (!ctxLine) {
    return;
  }

  const trend = dashboardData?.trend || [];

  if (lineChart) {
    lineChart.destroy();
  }

  const labels = trend.map((item) => getPersianMonth(item.month));

  // positive income
  const incomeData = trend.map((item) => Math.abs(Number(item.income) || 0));

  // positive expense
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

// GET Transactions
async function getTransactions() {
  try {
    const response = await api.get("/transactions");

    transactions = response.data?.data?.transactions || [];

    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    renderLatestTransactions();
  } catch (error) {
    showToast(error.response?.data?.message || "تراکنش‌ها دریافت نشدند.");
  }
}

// Sort Latest Transactions
function sortLatestTransactions(transactionList) {
  return [...transactionList].sort((a, b) => {
    const dateA = new Date(getTransactionDate(a));
    const dateB = new Date(getTransactionDate(b));

    return dateB - dateA;
  });
}

// Render Latest Transactions
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
    const title = transaction.title || "بدون عنوان";
    const amount = +transaction.display_amount || 0;
    const type = transaction.type || "expense";
    const categoryName = getTransactionCategoryName(transaction);
    const tag = getTransactionTag(transaction);
    const date = getTransactionDate(transaction);

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

// GET Budgets
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
    showToast(
      error.response?.data?.message || "بودجه‌ها دریافت نشدند.",
      "error",
    );
  }
}

// Budget Icon
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

// Render Dashboard Budgets
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

// Create Dashboard Budget
function createDashboardBudget(budget) {
  const categoryName =
    budget.category?.name ||
    budget.category_name ||
    findCategoryById(budget.category?.id || budget.category_id)?.name ||
    "بدون دسته‌بندی";

  const total = +budget.budget_amount || 0;

  const spent = +budget.spent_amount || 0;

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
function showNoWalletState() {
  const page = document.querySelector(".page");

  if (!page) return;

  page.innerHTML = `
    <div class="empty-wallet-state">
      <div class="empty-wallet-icon">
        <i class="fas fa-wallet"></i>
      </div>

      <h2>هنوز کیف پولی ایجاد نکرده‌اید</h2>

      <p>
        برای شروع مدیریت درآمد و هزینه‌ها،
        ابتدا یک کیف پول ایجاد کنید.
      </p>

      <button class="create-wallet-btn" id="createWalletBtn">
        <i class="fas fa-plus"></i>
        ایجاد کیف پول
      </button>
    </div>
  `;

  document.getElementById("createWalletBtn")?.addEventListener("click", () => {
    window.location.href = "./setting.html";
  });
}

// Check & Set Wallet
async function checkAndSetWallet() {
  try {
    const response = await api.get("/wallets");
    const wallets =
      response.data?.data?.wallets || response.data?.wallets || [];

    // walletId قبلی را پاک می‌کنیم
    localStorage.removeItem("walletId");

    // اگر کاربر کیف پولی ندارد
    if (!Array.isArray(wallets) || wallets.length === 0) {
      showNoWalletState();
      return false;
    }

    // اولین کیف پول کاربر
    const walletId = wallets[0].id;

    // ذخیره کیف پول جدید
    localStorage.setItem("walletId", walletId);

    return true;
  } catch (error) {
    showToast(
      error.response?.data?.message || "اطلاعات کیف پول دریافت نشد.",
      "error",
    );

    return false;
  }
}

// Dashboard Skeleton
function showDashboardSkeleton() {
  // Cards
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.add("skeleton-card");
  });

  document
    .querySelectorAll(".card-info p, .card-info h2")
    .forEach((element) => {
      element.classList.add("dashboard-skeleton");
    });

  // Prediction Card
  const predictionCard = document.querySelector(".prediction-card");

  if (predictionCard) {
    predictionCard
      .querySelector(".prediction-month")
      ?.classList.add("dashboard-skeleton");

    predictionCard
      .querySelector(".predicted-income")
      ?.classList.add("dashboard-skeleton");

    predictionCard
      .querySelector(".predicted-expense")
      ?.classList.add("dashboard-skeleton");
  }
  // Charts
  document
    .querySelectorAll(".chart-container, .process-chart-container")
    .forEach((container) => {
      // اگر قبلاً skeleton ساخته شده، دوباره نساز
      if (container.querySelector(".chart-skeleton-overlay")) {
        return;
      }

      const skeleton = document.createElement("div");
      skeleton.className = "dashboard-skeleton chart-skeleton-overlay";
      container.style.position = "relative";
      container.appendChild(skeleton);
    });

  // Chart Text
  const chartText = document.querySelector(".chart-text");

  if (chartText) {
    chartText.dataset.originalText = chartText.textContent;

    chartText.innerHTML = `
      <span
        class="dashboard-skeleton"
        style="
          display: block;
          width: 70%;
          height: 16px;
          border-radius: 5px;
        "
      ></span>
    `;
  }

  // Budgets
  if (budgetList) {
    budgetList.innerHTML = `
      <div class="skeleton-budget">
        <div class="skeleton-budget-info">
          <span class="dashboard-skeleton"></span>
          <span class="dashboard-skeleton"></span>
        </div>

        <div class="dashboard-skeleton skeleton-progress"></div>
      </div>

      <div class="skeleton-budget">
        <div class="skeleton-budget-info">
          <span class="dashboard-skeleton"></span>
          <span class="dashboard-skeleton"></span>
        </div>

        <div class="dashboard-skeleton skeleton-progress"></div>
      </div>

      <div class="skeleton-budget">
        <div class="skeleton-budget-info">
          <span class="dashboard-skeleton"></span>
          <span class="dashboard-skeleton"></span>
        </div>

        <div class="dashboard-skeleton skeleton-progress"></div>
      </div>
    `;
  }

  // Transactions
  if (transactionBody) {
    transactionBody.innerHTML = `
      <tr class="skeleton-row">
        <td>
          <span class="dashboard-skeleton skeleton-cell short"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell medium"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell short"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell medium"></span>
        </td>
      </tr>
      <tr class="skeleton-row">
        <td>
          <span class="dashboard-skeleton skeleton-cell short"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell medium"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell short"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell medium"></span>
        </td>
      </tr>
      <tr class="skeleton-row">
        <td>
          <span class="dashboard-skeleton skeleton-cell short"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell medium"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell short"></span>
        </td>
        <td>
          <span class="dashboard-skeleton skeleton-cell medium"></span>
        </td>
      </tr>
    `;
  }
}

// Remove Dashboard Skeleton
function hideDashboardSkeleton() {
  // Cards
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.remove("skeleton-card");
  });

  document
    .querySelectorAll(".card-info p, .card-info h2")
    .forEach((element) => {
      element.classList.remove("dashboard-skeleton");
    });

  // Chart Skeleton
  document.querySelectorAll(".chart-skeleton-overlay").forEach((element) => {
    element.remove();
  });

  // Chart Text
  const chartText = document.querySelector(".chart-text");

  if (chartText) {
    const originalText = chartText.dataset.originalText;

    if (originalText) {
      chartText.textContent = originalText;
      delete chartText.dataset.originalText;
    }
  }

  // Other Skeletons
  document.querySelectorAll(".dashboard-skeleton").forEach((element) => {
    element.classList.remove("dashboard-skeleton");
  });

  document.querySelectorAll(".skeleton-panel").forEach((panel) => {
    panel.classList.remove("skeleton-panel");
  });
}

// Initial Load
async function initDashboard() {
  showDashboardSkeleton();

  try {
    // دریافت کیف پول‌های کاربر
    const hasWallet = await checkAndSetWallet();

    // اگر کیف پول وجود نداشت
    if (!hasWallet) return;

    await loadBaseCurrency();

    await getCategories();

    await getDashboard();

    await Promise.all([getTransactions(), getBudgets()]);

    hideDashboardSkeleton();
  } catch (error) {
    hideDashboardSkeleton();

    showToast(
      error?.response?.data?.message ||
        error?.message ||
        "خطایی در دریافت اطلاعات داشبورد رخ داد.",
      "error",
    );
  }
}

// Init
async function setName() {
  try {
    const response = await api.get("/me");
    const successMessage = response.data?.data?.message;
    const userName = response.data.data.user.name;

    localStorage.setItem("userName", userName);
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.data?.message || "ورود انجام نشد.";

      showToast(message);
    } else {
      showToast("ارتباط با سرور برقرار نشد.");
    }
  }
}

initDashboard();
setName();
