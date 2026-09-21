import api from "./api.js";
import { showToast } from "../../utils/Toast.js";
import "../../utils/notification.js";
import "../../utils/logOut.js";

// Elements
const addBudgetBtn = document.getElementById("addBudgetBtn");
const budgetModal = document.querySelector(".budget-modal");
const closeBudgetModal = document.getElementById("closeBudgetModal");
const cancelBudget = document.getElementById("cancelBudget");
const budgetForm = document.getElementById("budgetForm");
const budgetCategory = document.getElementById("budgetCategory");
const budgetAmount = document.getElementById("budgetAmount");
const modalTitle = document.getElementById("modalTitle");
const budgetList = document.getElementById("budgetList");
const usernameElement = document.querySelector("#headerUsername");
const modalOverlay = document.querySelector(".modal-overlay");
const modalContent = document.querySelector(".modal-content");
const amountError = document.querySelector(".amountError");

// Global Loader
const globalLoader = document.getElementById("globalLoader");

// Local Loader
const budgetLoader = document.getElementById("budgetLoader");

// Global Variables
let editingCard = null;
let categories = [];

// Base Currency
let baseCurrency = "ریال";

// Username
const username = localStorage.getItem("userName");
if (usernameElement) {
  usernameElement.textContent = username || "کاربر";
}

// Global Loader
function showGlobalLoader() {
  if (globalLoader) {
    globalLoader.classList.remove("hidden");
  }
}

function hideGlobalLoader() {
  if (globalLoader) {
    globalLoader.classList.add("hidden");
  }
}

// Local Loader
function showBudgetLoader() {
  if (budgetLoader) {
    budgetLoader.classList.remove("hidden");
  }
}

function hideBudgetLoader() {
  if (budgetLoader) {
    budgetLoader.classList.add("hidden");
  }
}

// Load Base Currency From Profile
async function loadBaseCurrency() {
  try {
    const response = await api.get("/profile");
    const profile = response.data?.data?.profile;
    const currencyId = profile?.currency?.id;

    if (currencyId !== null && currencyId !== undefined && currencyId !== "") {
      await loadCurrencyById(currencyId);
      return;
    }

    if (profile?.currency && typeof profile.currency === "object") {
      const currencyName = profile.currency.name;

      if (currencyName) {
        baseCurrency = currencyName;

        return;
      }
    }

    if (typeof profile?.currency === "string" && profile.currency.trim()) {
      baseCurrency = profile.currency.trim();

      return;
    }

    // currency_symbol
    if (profile?.currency.symbol) {
      baseCurrency = profile.currency.symbol;

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
  return `${(+number).toLocaleString("en-US")} ${baseCurrency}`;
}

// Load Categories
async function loadCategories() {
  try {
    const response = await api.get("/categories");
    categories = response.data?.data?.categories || [];

    renderCategoryOptions();
  } catch (error) {
    showToast(
      error.response?.data?.message || "خطا در دریافت دسته‌بندی‌ها",
      "error",
    );
  }
}

// Render Category Options
function renderCategoryOptions() {
  if (!budgetCategory) {
    return;
  }

  budgetCategory.innerHTML = `
    <option value="">انتخاب دسته‌بندی</option>
  `;

  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );

  expenseCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;

    budgetCategory.appendChild(option);
  });
}

// Load Budgets
async function loadBudgets({ local = false } = {}) {
  try {
    const walletId = localStorage.getItem("walletId");

    if (!walletId) {
      showToast("کیف پول انتخاب نشده است", "error");

      return;
    }

    if (local) {
      showBudgetLoader();
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

    const budgets = response.data?.data?.budgets || [];

    renderBudgets(budgets);
  } catch (error) {
    showToast(
      error.response?.data?.message || "خطا در دریافت بودجه‌ها",
      "error",
    );
  } finally {
    if (local) {
      hideBudgetLoader();
    }
  }
}

// Render Budgets
function renderBudgets(budgets) {
  const oldCards = budgetList.querySelectorAll(".budget-card");

  oldCards.forEach((card) => {
    card.remove();
  });

  const oldEmpty = budgetList.querySelector(".empty-budget");

  if (oldEmpty) {
    oldEmpty.remove();
  }

  // Empty State
  if (!Array.isArray(budgets) || budgets.length === 0) {
    const emptyElement = document.createElement("div");
    emptyElement.className = "empty-budget";
    emptyElement.innerHTML = `
      <p>
        برای این ماه بودجه‌ای ثبت نشده است.
      </p>
    `;

    if (budgetLoader) {
      budgetList.insertBefore(emptyElement, budgetLoader);
    } else {
      budgetList.appendChild(emptyElement);
    }

    return;
  }
  // Create Cards
  budgets.forEach((budget) => {
    createBudgetCard(budget);
  });
}

// Create Budget Card
function createBudgetCard(budget) {
  const budgetId = budget.id;
  const card = document.createElement("div");
  card.className = "budget-card";
  card.dataset.id = budgetId;
  const categoryId = budget.category?.id || budget.category_id;
  card.dataset.category = categoryId || "";

  // Category
  let categoryName = "دسته‌بندی";

  if (budget.category?.name) {
    categoryName = budget.category.name;
  } else if (categoryId) {
    const foundCategory = categories.find(
      (category) =>
        +category.id === +categoryId || +category.category_id === +categoryId,
    );

    if (foundCategory) {
      categoryName = foundCategory.name;
    }
  }

  // Amounts
  const total = +budget.budget_amount || 0;
  const spent = +budget.spent_amount || 0;

  // Remaining
  const remaining = Math.max(total - spent, 0);

  // Debt
  const debt = total - spent;
  const hasDebt = debt < 0;

  // Percentage
  let percentage = total > 0 ? (spent / total) * 100 : 0;

  if (percentage > 100) {
    percentage = 100;
  }

  // Warning
  let warningClass = "";

  if (percentage >= 80) {
    warningClass = "warning";
  }

  // Icon
  let icon = "fa-wallet";
  const name = categoryName.toLowerCase();

  if (
    name.includes("خانه") ||
    name.includes("مسکن") ||
    name.includes("اجاره")
  ) {
    icon = "fa-house";
  } else if (
    name.includes("خرید") ||
    name.includes("فروشگاه") ||
    name.includes("لباس")
  ) {
    icon = "fa-cart-shopping";
  } else if (
    name.includes("غذا") ||
    name.includes("رستوران") ||
    name.includes("خوراک")
  ) {
    icon = "fa-utensils";
  } else if (
    name.includes("حمل") ||
    name.includes("تاکسی") ||
    name.includes("ماشین") ||
    name.includes("رفت")
  ) {
    icon = "fa-car";
  } else if (
    name.includes("سلامت") ||
    name.includes("پزشک") ||
    name.includes("دارو")
  ) {
    icon = "fa-heart-pulse";
  } else if (name.includes("تفریح") || name.includes("سرگرمی")) {
    icon = "fa-gamepad";
  } else if (name.includes("آموزش") || name.includes("تحصیل")) {
    icon = "fa-graduation-cap";
  }

  // Card HTML
  card.innerHTML = `
    <div class="budget-card-header">
      <div class="budget-title">
        <div class="budget-icon">
          <i class="fas ${icon}"></i>
        </div>
        <div>
          <h3>
            ${categoryName}
          </h3>
          <span>
            بودجه ماهانه
          </span>
        </div>
      </div>
      <div class="budget-actions">
        <button
          class="edit-budget"
          data-id="${budgetId}"
          title="ویرایش"
        >
          <i class="fas fa-pen"></i>
        </button>
        <button
          class="delete-budget"
          data-id="${budgetId}"
          title="حذف"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="budget-amounts">
      <div class="spent-amount">
        <span>
          مصرف شده
        </span>
        <strong>
          ${formatMoney(spent)}
        </strong>
      </div>
      <div class="total-amount">
        <span>
          بودجه
        </span>
        <strong>
          ${formatMoney(total)}
        </strong>
      </div>
    </div>
    <div class="progress-info">
      <span class="percentage">
        ${Math.round(percentage)}٪ مصرف شده
      </span>
      ${
        hasDebt
          ? `
            <span class="debt">
              بدهی: ${formatMoney(debt)}
            </span>
          `
          : `
            <span class="remaining">
              ${formatMoney(remaining)} باقی‌مانده
            </span>
          `
      }
    </div>
    <div class="progress-bar">
      <div
        class="progress-fill ${warningClass}"
        style="width: ${percentage}%"
      ></div>
    </div>
  `;

  // Edit
  const editButton = card.querySelector(".edit-budget");
  if (editButton) {
    editButton.addEventListener("click", () => {
      editingCard = card;

      const budgetCategoryId = budget.category?.id || categoryId;
      budgetCategory.value = budgetCategoryId || "";
      budgetAmount.value = total.toLocaleString("en-US");
      modalTitle.textContent = "ویرایش بودجه";
      budgetModal.classList.add("active");
      budgetModal.classList.remove("hidden");

      document.body.classList.add("modal-open");
    });
  }

  // Delete
  const deleteButton = card.querySelector(".delete-budget");

  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `آیا از حذف بودجه «${categoryName}» مطمئن هستید؟`,
      );

      if (!confirmed) {
        return;
      }

      try {
        showGlobalLoader();
        await api.delete(`/budget/delete/${budgetId}`);
        showToast("بودجه با موفقیت حذف شد.", "success");

        await loadBudgets();
      } catch (error) {
        showToast(
          error.response?.data?.message || "حذف بودجه انجام نشد.",
          "error",
        );
      } finally {
        hideGlobalLoader();
      }
    });
  }

  // Add Card
  if (budgetLoader) {
    budgetList.insertBefore(card, budgetLoader);
  } else {
    budgetList.appendChild(card);
  }
}

// Open Modal
function openModal() {
  editingCard = null;
  modalTitle.textContent = "افزودن بودجه";
  budgetForm.reset();
  amountError.classList.add("hidden");
  budgetModal.classList.remove("hidden");
  budgetModal.classList.add("active");
  modalContent.classList.add("animate");

  document.body.classList.add("modal-open");
}

// Close Modal
function closeModal() {
  editingCard = null;
  budgetModal.classList.add("hidden");
  budgetModal.classList.remove("active");
  modalContent.classList.remove("animate");
  budgetForm.reset();
  amountError.classList.add("hidden");

  document.body.classList.remove("modal-open");
}

// Modal Events
if (addBudgetBtn) {
  addBudgetBtn.addEventListener("click", openModal);
}

if (closeBudgetModal) {
  closeBudgetModal.addEventListener("click", closeModal);
}

if (cancelBudget) {
  cancelBudget.addEventListener("click", closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", closeModal);
}

// Submit Budget
if (budgetForm) {
  budgetForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const categoryId = budgetCategory.value;
    const amount = +budgetAmount.value.replace(/,/g, "");

    // Amount Validation
    if (!amount || amount <= 0) {
      amountError.classList.remove("hidden");
      return;
    }

    amountError.classList.add("hidden");

    // Category Validation
    if (!categoryId) {
      showToast("لطفاً یک دسته‌بندی انتخاب کنید");
      return;
    }

    // Edit
    if (editingCard) {
      await updateBudget(editingCard, categoryId, amount);
      return;
    }

    // Create
    await createBudget(categoryId, amount);
  });
}

// Create Budget
async function createBudget(categoryId, amount) {
  try {
    const walletId = localStorage.getItem("walletId");

    if (!walletId) {
      showToast("کیف پول انتخاب نشده است", "error");

      return;
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const formData = new FormData();
    formData.append("wallet_id", walletId);
    formData.append("category_id", categoryId);
    formData.append("amount", amount);
    formData.append("year", year);
    formData.append("month", month);
    const response = await api.post("/budget/create", formData);

    showToast(response.data?.message || "بودجه با موفقیت ایجاد شد", "success");

    closeModal();

    await loadBudgets({
      local: true,
    });
  } catch (error) {
    const message = error.response?.data?.message || "خطا در ایجاد بودجه";

    showToast(message, "error");
  }
}

// Update Budget
async function updateBudget(card, categoryId, amount) {
  try {
    const walletId = localStorage.getItem("walletId");

    if (!walletId) {
      showToast("کیف پول انتخاب نشده است", "error");

      return;
    }

    const budgetId = card.dataset.id;
    if (!budgetId) {
      showToast("شناسه بودجه پیدا نشد");

      return;
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const budgetData = {
      wallet_id: +walletId,
      category_id: +categoryId,
      amount: +amount,
      year: +year,
      month: +month,
    };

    const response = await api.put(`/budget/update/${budgetId}`, budgetData);

    showToast(response.data?.message || "بودجه با موفقیت ویرایش شد", "success");
    closeModal();

    await loadBudgets({
      local: true,
    });
  } catch (error) {
    showToast(error.response?.data?.message || "خطا در ویرایش بودجه", "error");
  }
}

// Progress
function updateProgress(card, spent, total) {
  let percentage = total > 0 ? (spent / total) * 100 : 0;

  if (percentage > 100) {
    percentage = 100;
  }

  const remaining = Math.max(total - spent, 0);
  const percentageElement = card.querySelector(".percentage");
  const remainingElement = card.querySelector(".remaining");
  const progressFill = card.querySelector(".progress-fill");
  if (percentageElement) {
    percentageElement.textContent = `${Math.round(percentage)}٪ مصرف شده`;
  }

  if (remainingElement) {
    remainingElement.textContent = `${formatMoney(remaining)} باقی‌مانده`;
  }

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;

    if (percentage >= 80) {
      progressFill.classList.add("warning");
    } else {
      progressFill.classList.remove("warning");
    }
  }
}

// Initial Load
async function init() {
  showGlobalLoader();

  try {
    await loadBaseCurrency();
    await loadCategories();
    await loadBudgets();
  } catch (error) {
    showToast("INITIAL LOAD ERROR:");
  } finally {
    hideGlobalLoader();
  }
}

budgetAmount.addEventListener("input", function () {
  let value = this.value.replace(/\D/g, "");

  if (value) {
    this.value = Number(value).toLocaleString("en-US");
  } else {
    this.value = "";
  }
});

// Init
init();
