import api from "./api.js";

import { showToast } from "../../utils/Toast.js";

// ======================================================
// Elements
// ======================================================

const usernameElement = document.querySelector("#headerUsername");

const searchInput = document.getElementById("search");

const monthFilter = document.getElementById("monthFilter");

const categoryFilter = document.getElementById("categoryFilter");

const tagFilter = document.getElementById("tagFilter");

const paymentFilter = document.getElementById("paymentFilter");

const sortFilter = document.getElementById("sortFilter");

const transactionBody = document.getElementById("transactionBody");

const addTransactionBtn = document.querySelector(".add-btn");

const closeModalBtn = document.querySelector(".close-modal");

const transactionModal = document.querySelector(".transaction-modal");

const cancelBtn = document.querySelector(".cancel-btn");

const saveBtn = document.querySelector(".save-btn");

const transactionModalTitle = document.getElementById("transactionTitle");

const transactionModalAmount = document.getElementById("transactionAmount");

const categoryOptionsContainer = document.querySelector(".category-options");

const categoryError = document.querySelector(".categoryError");

const receiptInput = document.getElementById("receiptInput");

const receiptPreview = document.getElementById("receiptPreview");

const receiptCanvas = document.getElementById("receiptCanvas");

const cropReceiptBtn = document.getElementById("cropReceiptBtn");

const removeReceiptBtn = document.getElementById("removeReceiptBtn");

const recurringTransaction = document.getElementById("recurringTransaction");

const recurringFields = document.getElementById("recurringFields");

const modalContent = document.querySelector(".modal-content");

const modalOverlay = document.querySelector(".modal-overlay");

const transactionTitleError = document.querySelector(".transactionTitleError");

const transactionAmountError = document.querySelector(
  ".transactionAmountError",
);

const uploadProgress = document.querySelector(".upload-progress");

const uploadPercent = document.querySelector("#uploadPercent");

const uploadProgressFill = document.querySelector(".upload-progress-fill");

const overlay = document.querySelector(".overlay");

const transactionLoader = document.getElementById("transactionLoader");

const saveIcon = document.querySelector(".save-icon");

const saveText = document.querySelector(".save-text");

const localLoader = document.querySelector(".local-loader");

// ======================================================
// Username
// ======================================================

const username = localStorage.getItem("userName");

if (usernameElement) {
  usernameElement.textContent = username || "کاربر";
}

// ======================================================
// Base Currency
// ======================================================

let baseCurrency = "";

/**
 * فرمت کردن عدد
 */
function formatNumber(number) {
  const numericValue = Number(number) || 0;

  return numericValue.toLocaleString("en-US");
}

/**
 * فرمت مبلغ با سمبل ارز پایه
 *
 * مثال:
 * 1,500 $
 * 2,000 €
 * 3,000 ﷼
 */
function formatMoney(number) {
  const formatted = formatNumber(number);

  if (!baseCurrency) {
    return formatted;
  }

  return `${formatted} ${baseCurrency}`;
}

/**
 * دریافت ارز پایه از پروفایل
 */
async function loadBaseCurrency() {
  try {
    console.log("در حال دریافت پروفایل برای ارز پایه...");

    const response = await api.get("/profile");

    console.log("Profile response:", response.data);

    const profile =
      response.data?.data?.profile ||
      response.data?.data ||
      response.data?.profile ||
      response.data;

    if (!profile) {
      console.error("اطلاعات پروفایل پیدا نشد.");
      return;
    }

    let currencyId =
      profile.currency_id ??
      profile.currencyId ??
      profile.currency?.id ??
      profile.currency?.currency_id ??
      null;

    /*
      اگر خود پروفایل آبجکت ارز را برگرداند،
      مستقیماً سمبل را استفاده می‌کنیم.
    */
    if (profile.currency && typeof profile.currency === "object") {
      const profileCurrency = profile.currency;

      baseCurrency =
        profileCurrency.symbol ||
        profileCurrency.currency_symbol ||
        profileCurrency.code ||
        profileCurrency.name ||
        "";

      if (baseCurrency) {
        console.log("✅ Base Currency Symbol From Profile:", baseCurrency);

        return;
      }
    }

    if (currencyId === null || currencyId === undefined || currencyId === "") {
      console.error("currency_id در پروفایل پیدا نشد.");

      baseCurrency = "";

      return;
    }

    await loadCurrencyById(currencyId);
  } catch (error) {
    console.error("خطا در دریافت ارز پایه:", error);

    baseCurrency = "";
  }
}

/**
 * پیدا کردن ارز بر اساس currency_id
 */
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

      baseCurrency = "";

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

      baseCurrency = "";

      return;
    }

    /*
      فقط سمبل ارز نمایش داده می‌شود.
      اولویت:
      symbol
      currency_symbol
      code
      name
    */
    baseCurrency =
      currency.symbol ||
      currency.currency_symbol ||
      currency.code ||
      currency.name ||
      "";

    console.log("✅ Base Currency Symbol:", baseCurrency);
  } catch (error) {
    console.error("خطا در دریافت ارزها:", error);

    baseCurrency = "";
  }
}

// ======================================================
// Global Loader
// ======================================================

function showGlobalLoader() {
  if (overlay) {
    overlay.classList.remove("hidden");
  }
}

function hideGlobalLoader() {
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

// ======================================================
// Bottom / Infinite Scroll Loader
// ======================================================

function showTransactionLoader() {
  if (transactionLoader) {
    transactionLoader.classList.remove("hidden");
  }
}

function hideTransactionLoader() {
  if (transactionLoader) {
    transactionLoader.classList.add("hidden");
  }
}

// ======================================================
// Local Save Loader
// ======================================================

function showSaveLoader() {
  if (!saveBtn) {
    return;
  }

  saveBtn.disabled = true;

  if (saveIcon) {
    saveIcon.classList.add("hidden");
  }

  if (saveText) {
    saveText.textContent = editingTransaction
      ? "در حال ویرایش..."
      : "در حال ذخیره...";
  }

  if (localLoader) {
    localLoader.classList.remove("hidden");
  }
}

function hideSaveLoader() {
  if (!saveBtn) {
    return;
  }

  saveBtn.disabled = false;

  if (saveIcon) {
    saveIcon.classList.remove("hidden");
  }

  if (saveText) {
    saveText.textContent = editingTransaction
      ? "ویرایش تراکنش"
      : "ذخیره تراکنش";
  }

  if (localLoader) {
    localLoader.classList.add("hidden");
  }
}

// ======================================================
// Categories
// ======================================================

let selectedCategory = "";

let selectedCategoryId = "";

let selectedParentCategoryId = null;

let categories = [];

let transactions = [];

let editingTransaction = null;

// ======================================================
// Infinite Scroll State
// ======================================================

let isLoadingMore = false;

let hasMoreTransactions = true;

let currentTransactionCount = 0;

// ======================================================
// Parent ID
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
// Get Children
// ======================================================

function getCategoryChildren(category) {
  if (!category) {
    return [];
  }

  if (Array.isArray(category.children)) {
    return category.children;
  }

  const categoryId = String(category.id);

  return categories.filter((item) => {
    const parentId = getParentId(item);

    return (
      parentId !== null &&
      parentId !== undefined &&
      String(parentId) === categoryId
    );
  });
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

    const children = getCategoryChildren(category);

    const child = children.find((item) => String(item.id) === id);

    if (child) {
      return child;
    }
  }

  return null;
}

// ======================================================
// Find Parent Category
// ======================================================

function findParentCategory(categoryId) {
  if (categoryId === null || categoryId === undefined || categoryId === "") {
    return null;
  }

  const id = String(categoryId);

  const directCategory = categories.find(
    (category) => String(category.id) === id,
  );

  if (directCategory) {
    const parentId = getParentId(directCategory);

    if (parentId === null || parentId === undefined || parentId === "") {
      return directCategory;
    }

    return findParentCategory(parentId);
  }

  for (const category of categories) {
    const children = getCategoryChildren(category);

    const child = children.find((item) => String(item.id) === id);

    if (child) {
      return category;
    }
  }

  return null;
}

// ======================================================
// Get Parent Category ID
// ======================================================

function getParentCategoryId(categoryId) {
  if (categoryId === null || categoryId === undefined || categoryId === "") {
    return "";
  }

  const id = String(categoryId);

  const parentCategory = findParentCategory(id);

  if (parentCategory) {
    return String(parentCategory.id);
  }

  const category = findCategoryById(id);

  if (!category) {
    return id;
  }

  const parentId = getParentId(category);

  if (parentId === null || parentId === undefined || parentId === "") {
    return String(category.id);
  }

  return String(parentId);
}

// ======================================================
// Category Click
// ======================================================

categoryOptionsContainer.addEventListener("click", (event) => {
  const categoryButton = event.target.closest(".category-option");

  if (!categoryButton) {
    return;
  }

  const categoryId = String(categoryButton.dataset.categoryId);

  const categoryName =
    categoryButton.querySelector("span")?.textContent.trim() || "";

  categoryOptionsContainer
    .querySelectorAll(".category-option")
    .forEach((item) => {
      item.classList.remove("active");
    });

  categoryButton.classList.add("active");

  const currentCategory = findCategoryById(categoryId);

  if (!currentCategory) {
    console.error("Category not found:", categoryId);
    return;
  }

  const children = getCategoryChildren(currentCategory);

  // Parent

  if (children.length > 0) {
    selectedCategory = "";
    selectedCategoryId = "";
    selectedParentCategoryId = categoryId;

    categoryError.classList.remove("hidden");

    showSubcategories(children, categoryButton);

    return;
  }

  // Category Without Children

  selectedCategory = categoryName;

  selectedCategoryId = categoryId;

  selectedParentCategoryId = null;

  categoryError.classList.add("hidden");

  const oldDropdown = categoryButton.parentElement.querySelector(
    ".subcategory-dropdown",
  );

  if (oldDropdown) {
    oldDropdown.remove();
  }
});

// ======================================================
// Show Subcategories
// ======================================================

function showSubcategories(children, parentButton) {
  const oldDropdown = parentButton.parentElement.querySelector(
    ".subcategory-dropdown",
  );

  if (oldDropdown) {
    oldDropdown.remove();
  }

  const dropdown = document.createElement("select");

  dropdown.className = "subcategory-dropdown";

  dropdown.innerHTML = `
    <option value="">
      انتخاب زیردسته
    </option>
  `;

  children.forEach((child) => {
    const option = document.createElement("option");

    option.value = child.id;

    option.textContent = child.name;

    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", () => {
    const selectedId = dropdown.value;

    if (!selectedId) {
      selectedCategory = "";

      selectedCategoryId = "";

      categoryError.classList.remove("hidden");

      return;
    }

    const selectedChild = children.find(
      (child) => String(child.id) === String(selectedId),
    );

    if (!selectedChild) {
      console.error("Subcategory not found");
      return;
    }

    selectedCategory = selectedChild.name;

    selectedCategoryId = String(selectedChild.id);

    selectedParentCategoryId = String(parentButton.dataset.categoryId);

    categoryError.classList.add("hidden");
  });

  parentButton.parentElement.appendChild(dropdown);
}

// ======================================================
// Transaction Helpers
// ======================================================

function getTransactionTitle(transaction) {
  return (
    transaction.title ||
    transaction.description ||
    transaction.name ||
    transaction.note ||
    ""
  );
}

function getTransactionAmount(transaction) {
  return +transaction.amount || 0;
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
// Payment
// ======================================================

function getTransactionPayment(transaction) {
  return (
    transaction.payment_method ||
    transaction.paymentMethod ||
    transaction.payment ||
    "cash"
  );
}

// ======================================================
// TAG
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
// Get Transaction Tag
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
// Save TAG
// ======================================================

function saveTransactionTag(transactionId, tag) {
  if (!transactionId) {
    return;
  }

  const savedTags = JSON.parse(localStorage.getItem("transactionTags") || "{}");

  savedTags[String(transactionId)] = normalizeTag(tag);

  localStorage.setItem("transactionTags", JSON.stringify(savedTags));
}

// ======================================================
// Date Helper
// ======================================================

function getTransactionDate(transaction) {
  const date = transaction.created_at || "";

  if (!date) {
    return "";
  }

  return String(date).split(" ")[0].split("T")[0];
}

// ======================================================
// Recurring Helpers
// ======================================================

function getFrequencyValue() {
  const frequencyInput =
    document.querySelector('input[name="frequency"]:checked') ||
    document.getElementById("frequency") ||
    document.querySelector('[name="frequency"]') ||
    document.querySelector(".frequency");

  return frequencyInput?.value || "";
}

function getRepeatCountValue() {
  const repeatCountInput =
    document.getElementById("repeatCount") ||
    document.getElementById("repeat_count") ||
    document.querySelector('[name="repeat_count"]') ||
    document.querySelector('[name="repeatCount"]') ||
    document.querySelector(".repeat-count");

  return repeatCountInput?.value || "";
}

function getEndDateValue() {
  const endDateInput =
    document.getElementById("endDate") ||
    document.getElementById("end_date") ||
    document.querySelector('[name="end_date"]') ||
    document.querySelector('[name="endDate"]') ||
    document.querySelector(".end-date");

  return endDateInput?.value || "";
}

function resetRecurringFields() {
  if (!recurringTransaction) {
    return;
  }

  recurringTransaction.checked = false;

  if (recurringFields) {
    recurringFields.classList.add("hidden");
  }

  const frequencyInputs = document.querySelectorAll('input[name="frequency"]');

  frequencyInputs.forEach((input) => {
    input.checked = false;
  });

  const frequencySelect =
    document.getElementById("frequency") ||
    document.querySelector('select[name="frequency"]');

  if (frequencySelect) {
    frequencySelect.value = "";
  }

  const repeatCountInput =
    document.getElementById("repeatCount") ||
    document.getElementById("repeat_count") ||
    document.querySelector('[name="repeat_count"]') ||
    document.querySelector('[name="repeatCount"]');

  if (repeatCountInput) {
    repeatCountInput.value = "";
  }

  const endDateInput =
    document.getElementById("endDate") ||
    document.getElementById("end_date") ||
    document.querySelector('[name="end_date"]') ||
    document.querySelector('[name="endDate"]');

  if (endDateInput) {
    endDateInput.value = "";
  }
}

// ======================================================
// Show Transactions
// ======================================================

function showTransactions(transactionList) {
  transactionBody.innerHTML = "";

  if (transactionList.length === 0) {
    transactionBody.innerHTML = `
      <tr>
        <td
          class="no-result"
          colspan="7"
          style="color: var(--very-pink)"
        >
          تراکنشی پیدا نشد
        </td>
      </tr>
    `;

    return;
  }

  transactionList.forEach((transaction, index) => {
    const row = document.createElement("tr");

    const title = getTransactionTitle(transaction);

    const amount = getTransactionAmount(transaction);

    const type = getTransactionType(transaction);

    const categoryName = getTransactionCategoryName(transaction);

    const categoryId = getTransactionCategoryId(transaction);

    const payment = getTransactionPayment(transaction);

    const tag = getTransactionTag(transaction);

    const date = getTransactionDate(transaction);

    const displayAmount =
      type === "expense" ? -Math.abs(amount) : Math.abs(amount);

    /*
      مبلغ نمایش داده شده:
      قبلاً:
      ${displayAmount}

      الان:
      ${formatMoney(displayAmount)}
    */
    const formattedAmount = formatMoney(displayAmount);

    // Month

    let month = "all";

    if (date) {
      const dateObject = new Date(date);

      if (!isNaN(dateObject.getTime())) {
        month = String(dateObject.getMonth() + 1);
      }
    }

    // Data Attributes

    row.dataset.id = transaction.id || "";

    row.dataset.month = month;

    row.dataset.categoryId = categoryId;

    row.dataset.category = categoryName;

    row.dataset.tag = tag;

    row.dataset.payment = payment;

    row.dataset.amount = displayAmount;

    // Table Row

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
        ${formattedAmount}
      </td>

      <td>
        ${tag}
      </td>

      <td>
        ${date}
      </td>

      <td>
        <button
          class="delete-btn"
          data-id="${transaction.id || ""}"
        >
          <i class="fas fa-trash"></i>
        </button>

        <button
          class="edit-btn"
          data-id="${transaction.id || ""}"
        >
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;

    transactionBody.appendChild(row);
  });
}

// ======================================================
// Filter + Sort
// ======================================================

function filterTransactions() {
  const searchValue = searchInput.value.trim().toLowerCase();

  const selectedMonth = monthFilter.value;

  const selectedCategoryFilter = categoryFilter.value;

  const selectedTag = tagFilter.value;

  const selectedPayment = paymentFilter.value;

  const selectedSort = sortFilter.value;

  let filteredTransactions = transactions.filter((transaction) => {
    const title = getTransactionTitle(transaction);

    const date = getTransactionDate(transaction);

    const categoryId = getTransactionCategoryId(transaction);

    const categoryName = getTransactionCategoryName(transaction);

    const tag = getTransactionTag(transaction);

    const payment = getTransactionPayment(transaction);

    // Month

    let month = "all";

    if (date) {
      const dateObject = new Date(date);

      if (!isNaN(dateObject.getTime())) {
        month = String(dateObject.getMonth() + 1);
      }
    }

    // Search

    const matchesSearch = title.toString().toLowerCase().includes(searchValue);

    // Month

    const matchesMonth =
      selectedMonth === "all" ||
      selectedMonth === "" ||
      month === selectedMonth;

    // Category Parent / Child

    const parentCategoryId = getParentCategoryId(categoryId);

    const matchesCategory =
      selectedCategoryFilter === "all" ||
      selectedCategoryFilter === "" ||
      String(categoryId) === String(selectedCategoryFilter) ||
      String(parentCategoryId) === String(selectedCategoryFilter);

    // TAG

    const normalizedTransactionTag = normalizeTag(tag);

    const normalizedSelectedTag = normalizeTag(selectedTag);

    const matchesTag =
      selectedTag === "all" ||
      selectedTag === "" ||
      !selectedTag ||
      normalizedTransactionTag === normalizedSelectedTag;

    // Payment

    const matchesPayment =
      selectedPayment === "all" ||
      selectedPayment === "" ||
      String(payment) === String(selectedPayment);

    return (
      matchesSearch &&
      matchesMonth &&
      matchesCategory &&
      matchesTag &&
      matchesPayment
    );
  });

  // Sort

  filteredTransactions.sort((a, b) => {
    const amountA = Math.abs(getTransactionAmount(a));

    const amountB = Math.abs(getTransactionAmount(b));

    if (selectedSort === "highest") {
      return amountB - amountA;
    }

    if (selectedSort === "lowest") {
      return amountA - amountB;
    }

    return 0;
  });

  showTransactions(filteredTransactions);
}

// ======================================================
// Open Modal
// ======================================================

function openModal() {
  transactionModal.classList.remove("hidden");

  modalContent.classList.add("animate");
}

// ======================================================
// Close Modal
// ======================================================

function closeModal() {
  transactionModal.classList.add("hidden");

  modalContent.classList.remove("animate");
}

// ======================================================
// Reset Category
// ======================================================

function resetCategorySelection() {
  selectedCategory = "";

  selectedCategoryId = "";

  selectedParentCategoryId = null;

  categoryOptionsContainer
    .querySelectorAll(".category-option")
    .forEach((item) => {
      item.classList.remove("active");
    });

  categoryOptionsContainer
    .querySelectorAll(".subcategory-dropdown")
    .forEach((dropdown) => {
      dropdown.remove();
    });

  categoryError.classList.add("hidden");
}

// ======================================================
// Create New Transaction
// ======================================================

async function createNewTransaction(e) {
  e.preventDefault();

  showSaveLoader();

  try {
    const title = document.getElementById("transactionTitle")?.value.trim();

    const amount = Number(document.getElementById("transactionAmount")?.value);

    const paymentMethod =
      document.getElementById("paymentMethod")?.value || "cash";

    const token = localStorage.getItem("token");

    const walletId = localStorage.getItem("walletId");

    if (!title) {
      showToast("عنوان تراکنش را وارد کنید.", "error");
      return;
    }

    if (!amount || amount <= 0) {
      showToast("مبلغ تراکنش باید بیشتر از صفر باشد.", "error");
      return;
    }

    if (!token) {
      showToast("توکن ورود پیدا نشد.", "error");
      return;
    }

    if (!walletId) {
      showToast("کیف پول انتخاب نشده است.", "error");
      return;
    }

    if (!selectedCategoryId) {
      showToast("لطفاً دسته‌بندی را انتخاب کنید.", "error");
      return;
    }

    const type =
      document.querySelector('input[name="transactionType"]:checked')?.value ||
      "expense";

    const selectedTag =
      document.querySelector(".tag-option.selected")?.dataset.tag ||
      document.querySelector(".tag-option.active")?.dataset.tag ||
      null;

    const transactionData = new FormData();

    transactionData.append("wallet_id", walletId);

    transactionData.append("category_id", selectedCategoryId);

    transactionData.append("title", title);

    transactionData.append("payment_method", paymentMethod);

    transactionData.append("type", type);

    transactionData.append("amount", amount);

    if (croppedReceipt) {
      transactionData.append("receipt_image", croppedReceipt);
    } else {
      transactionData.append("receipt_image", "");
    }

    // recurring

    const isPeriodic =
      document.getElementById("recurringToggle")?.checked || false;

    transactionData.append("is_periodic", isPeriodic);

    if (isPeriodic) {
      const frequency =
        document.getElementById("recurringFrequency")?.value || "";

      const repeatCount = document.getElementById("repeatCount")?.value || "";

      const endDate = document.getElementById("recurringEndDate")?.value || "";

      transactionData.append("frequency", frequency);

      transactionData.append("repeat_count", repeatCount);

      transactionData.append("end_date", endDate);
    } else {
      transactionData.append("frequency", "");

      transactionData.append("repeat_count", "");

      transactionData.append("end_date", "");
    }

    // First Request

    let response;

    try {
      response = await api.post("/transaction/create", transactionData);
    } catch (error) {
      const responseData = error.response?.data?.data;

      if (
        error.response?.status === 409 &&
        responseData?.requires_confirmation === true &&
        responseData?.confirmation_type === "over_budget"
      ) {
        hideSaveLoader();

        const confirmed = window.confirm(
          responseData.message ||
            "این تراکنش باعث عبور از بودجه تعیین‌شده می‌شود. آیا همچنان می‌خواهید آن را ثبت کنید؟",
        );

        // Cancel

        if (!confirmed) {
          closeModal();
          return;
        }

        // OK

        showSaveLoader();

        transactionData.append("confirm_over_budget", "true");

        response = await api.post("/transaction/create", transactionData);
      } else {
        throw error;
      }
    }

    if (response?.data?.success !== false) {
      await getTransactions();

      const createdTransaction = transactions.find(
        (transaction) =>
          transaction.title === title &&
          Number(transaction.amount) === Number(amount),
      );

      if (createdTransaction && selectedTag) {
        const savedTags = JSON.parse(
          localStorage.getItem("transactionTags") || "{}",
        );

        savedTags[createdTransaction.id] = selectedTag;

        localStorage.setItem("transactionTags", JSON.stringify(savedTags));
      }

      filterTransactions();

      showToast(
        response?.data?.message || "تراکنش با موفقیت ثبت شد.",
        "success",
      );

      closeModal();

      resetRecurringFields();

      croppedReceipt = null;
    }
  } catch (error) {
    console.error("Create transaction error:", error);

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "ثبت تراکنش انجام نشد.",
      "error",
    );

    closeModal();
  } finally {
    hideSaveLoader();
  }
}

// ======================================================
// Delete + Edit
// ======================================================

transactionBody.addEventListener("click", async (event) => {
  // Delete

  const deleteBtn = event.target.closest(".delete-btn");

  if (deleteBtn) {
    const row = deleteBtn.closest("tr");

    if (!row) {
      return;
    }

    const transactionId = row.dataset.id;

    if (!transactionId) {
      showToast("شناسه تراکنش پیدا نشد.", "error");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");
      return;
    }

    try {
      const originalDeleteContent = deleteBtn.innerHTML;

      deleteBtn.disabled = true;

      deleteBtn.innerHTML = `
          <span class="local-loader"></span>
        `;

      await api.delete(`/transaction/delete/${transactionId}`);

      const savedTags = JSON.parse(
        localStorage.getItem("transactionTags") || "{}",
      );

      delete savedTags[String(transactionId)];

      localStorage.setItem("transactionTags", JSON.stringify(savedTags));

      showToast("تراکنش با موفقیت حذف شد.", "success");

      row.classList.add("slide-out");

      setTimeout(() => {
        transactions = transactions.filter(
          (transaction) => String(transaction.id) !== String(transactionId),
        );

        row.remove();

        filterTransactions();
      }, 400);
    } catch (error) {
      console.error("Delete transaction error:", error);

      showToast(
        error.response?.data?.message || "حذف تراکنش انجام نشد.",
        "error",
      );

      deleteBtn.disabled = false;

      deleteBtn.innerHTML = `
          <i class="fas fa-trash"></i>
        `;
    }

    return;
  }

  // Edit

  const editBtn = event.target.closest(".edit-btn");

  if (editBtn) {
    const row = editBtn.closest("tr");

    if (!row) {
      return;
    }

    openEditModal(row);
  }
});

// ======================================================
// Edit Modal
// ======================================================

function openEditModal(row) {
  const transactionId = row.dataset.id;

  const transaction = transactions.find(
    (item) => String(item.id) === String(transactionId),
  );

  if (!transaction) {
    showToast("تراکنش پیدا نشد.", "error");
    return;
  }

  editingTransaction = transaction;

  // Title

  const title = getTransactionTitle(transaction);

  transactionModalTitle.value = title;

  // Amount

  const amount = Math.abs(getTransactionAmount(transaction));

  transactionModalAmount.value = amount;

  // Category

  resetCategorySelection();

  const categoryId = getTransactionCategoryId(transaction);

  const categoryName = getTransactionCategoryName(transaction);

  const parentCategory = findParentCategory(categoryId);

  categoryOptionsContainer
    .querySelectorAll(".category-option")
    .forEach((categoryButton) => {
      const buttonCategoryId = categoryButton.dataset.categoryId;

      categoryButton.classList.remove("active");

      if (
        String(buttonCategoryId) === String(parentCategory?.id || categoryId)
      ) {
        categoryButton.classList.add("active");

        const currentCategory = findCategoryById(buttonCategoryId);

        const children = currentCategory
          ? getCategoryChildren(currentCategory)
          : [];

        if (children.length > 0) {
          selectedParentCategoryId = String(buttonCategoryId);

          selectedCategory = "";

          selectedCategoryId = "";

          categoryError.classList.remove("hidden");

          showSubcategories(children, categoryButton);

          const dropdown = categoryButton.parentElement.querySelector(
            ".subcategory-dropdown",
          );

          const child = children.find(
            (item) => String(item.id) === String(categoryId),
          );

          if (dropdown && child) {
            dropdown.value = child.id;

            selectedCategory = child.name;

            selectedCategoryId = String(child.id);

            categoryError.classList.add("hidden");
          }
        } else {
          selectedCategory = categoryName;

          selectedCategoryId = String(categoryId);

          selectedParentCategoryId = null;

          categoryError.classList.add("hidden");
        }
      }
    });

  // Transaction Type

  const transactionType = getTransactionType(transaction);

  const typeRadio = document.querySelector(
    `input[name="transactionType"][value="${transactionType}"]`,
  );

  if (typeRadio) {
    typeRadio.checked = true;
  }

  // Payment

  const payment = getTransactionPayment(transaction);

  const paymentRadio = document.querySelector(
    `input[name="payment"][value="${payment}"]`,
  );

  if (paymentRadio) {
    paymentRadio.checked = true;
  }

  // TAG

  const transactionTag = getTransactionTag(transaction);

  document.querySelectorAll(".tag-option input").forEach((input) => {
    input.checked = normalizeTag(input.value) === normalizeTag(transactionTag);
  });

  // Recurring

  const isPeriodic =
    transaction.is_periodic === true ||
    transaction.is_periodic === 1 ||
    transaction.is_periodic === "1" ||
    transaction.is_periodic === "true";

  if (recurringTransaction) {
    recurringTransaction.checked = isPeriodic;

    if (recurringFields) {
      if (isPeriodic) {
        recurringFields.classList.remove("hidden");
      } else {
        recurringFields.classList.add("hidden");
      }
    }
  }

  // Frequency

  const transactionFrequency = transaction.frequency || "";

  const frequencyRadio = document.querySelector(
    `input[name="frequency"][value="${transactionFrequency}"]`,
  );

  if (frequencyRadio) {
    frequencyRadio.checked = true;
  }

  const frequencySelect =
    document.getElementById("frequency") ||
    document.querySelector('select[name="frequency"]');

  if (frequencySelect) {
    frequencySelect.value = transactionFrequency;
  }

  // Repeat Count

  const repeatCountInput =
    document.getElementById("repeatCount") ||
    document.getElementById("repeat_count") ||
    document.querySelector('[name="repeat_count"]') ||
    document.querySelector('[name="repeatCount"]');

  if (repeatCountInput) {
    repeatCountInput.value = transaction.repeat_count || "";
  }

  // End Date

  const endDateInput =
    document.getElementById("endDate") ||
    document.getElementById("end_date") ||
    document.querySelector('[name="end_date"]') ||
    document.querySelector('[name="endDate"]');

  if (endDateInput) {
    endDateInput.value = transaction.end_date || "";
  }

  // Open Modal

  transactionModal.classList.remove("hidden");

  modalContent.classList.add("animate");

  // Save / Update

  saveBtn.onclick = (e) => {
    e.preventDefault();

    updateTransaction(row);
  };
}

// ======================================================
// Update Transaction
// ======================================================

async function updateTransaction(row) {
  const newTitle = transactionModalTitle.value.trim();

  const amount = +transactionModalAmount.value;

  if (!newTitle || !amount || !selectedCategoryId) {
    showToast("لطفاً اطلاعات تراکنش را کامل کنید.", "error");

    return;
  }

  // Transaction Type

  const transactionType = document.querySelector(
    'input[name="transactionType"]:checked',
  )?.value;

  if (!transactionType) {
    showToast("نوع تراکنش را انتخاب کنید.", "error");

    return;
  }

  // Payment

  const selectedPayment = document.querySelector(
    'input[name="payment"]:checked',
  );

  const payment = selectedPayment ? selectedPayment.value : "cash";

  // Amount

  const finalAmount = Math.abs(amount);

  // Transaction ID

  const transactionId = editingTransaction?.id;

  if (!transactionId) {
    showToast("شناسه تراکنش پیدا نشد.", "error");

    return;
  }

  // Token

  const token = localStorage.getItem("token");

  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");

    return;
  }

  // Date

  const transactionDate =
    getTransactionDate(editingTransaction) ||
    new Date().toISOString().split("T")[0];

  // TAG

  const selectedTag = document.querySelector(".tag-option input:checked");

  const tag = selectedTag ? selectedTag.value : "";

  // Recurring

  const isPeriodic = recurringTransaction?.checked || false;

  let frequency = "";

  let repeatCount = "";

  let endDate = "";

  if (isPeriodic) {
    frequency = getFrequencyValue();

    repeatCount = getRepeatCountValue();

    endDate = getEndDateValue();

    if (!frequency) {
      showToast("لطفاً دوره تکرار تراکنش را انتخاب کنید.", "error");

      return;
    }

    if (!repeatCount || +repeatCount <= 0) {
      showToast("لطفاً تعداد تکرار را وارد کنید.", "error");

      return;
    }

    if (!endDate) {
      showToast("لطفاً تاریخ پایان را انتخاب کنید.", "error");

      return;
    }
  }

  // Update Data

  const transactionData = {
    category_id: +selectedCategoryId,

    title: newTitle,

    payment_method: payment,

    type: transactionType,

    amount: finalAmount,

    transaction_date: transactionDate,

    frequency: frequency,

    repeat_count: repeatCount,

    is_periodic: isPeriodic,

    end_date: endDate,
  };

  // Send Update

  try {
    showSaveLoader();

    await api.put(`/transaction/update/${transactionId}`, transactionData);

    // Save Tag Frontend

    saveTransactionTag(transactionId, tag);

    // Reload

    await getTransactions();

    filterTransactions();

    showToast("تراکنش با موفقیت ویرایش شد.", "success");

    // Reset

    transactionModalTitle.value = "";

    transactionModalAmount.value = "";

    resetCategorySelection();

    document.querySelectorAll(".tag-option input").forEach((input) => {
      input.checked = false;
    });

    resetRecurringFields();

    editingTransaction = null;

    saveBtn.onclick = createNewTransaction;

    closeModal();
  } catch (error) {
    console.error("Update transaction error:", error);

    showToast(
      error.response?.data?.message || "ویرایش تراکنش انجام نشد.",
      "error",
    );
  } finally {
    hideSaveLoader();
  }
}

// ======================================================
// Events
// ======================================================

searchInput.addEventListener("input", filterTransactions);

monthFilter.addEventListener("change", filterTransactions);

categoryFilter.addEventListener("change", filterTransactions);

tagFilter.addEventListener("change", filterTransactions);

paymentFilter.addEventListener("change", filterTransactions);

sortFilter.addEventListener("change", filterTransactions);

// ======================================================
// Add Transaction
// ======================================================

addTransactionBtn.addEventListener("click", () => {
  editingTransaction = null;

  saveBtn.onclick = createNewTransaction;

  resetCategorySelection();

  resetRecurringFields();

  document.querySelectorAll(".tag-option input").forEach((input) => {
    input.checked = false;
  });

  openModal();
});

// ======================================================
// Close Buttons
// ======================================================

closeModalBtn.addEventListener("click", closeModal);

cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", closeModal);

// ======================================================
// Recurring Transaction
// ======================================================

recurringTransaction.addEventListener("change", () => {
  if (recurringTransaction.checked) {
    recurringFields.classList.remove("hidden");
  } else {
    recurringFields.classList.add("hidden");
  }
});

// ======================================================
// Receipt Upload
// ======================================================

const ctx = receiptCanvas.getContext("2d");

let receiptImage = null;

let croppedReceipt = null;

// ======================================================
// File Selected
// ======================================================

receiptInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  uploadProgress.classList.remove("hidden");

  uploadProgressFill.style.width = "0%";

  uploadPercent.textContent = "0%";

  const reader = new FileReader();

  reader.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);

      uploadProgressFill.style.width = `${percent}%`;

      uploadPercent.textContent = `${percent}%`;
    }
  });

  reader.addEventListener("load", (e) => {
    const img = new Image();

    img.addEventListener("load", () => {
      receiptImage = img;

      drawReceipt(img);

      receiptPreview.classList.remove("hidden");

      uploadProgressFill.style.width = "100%";

      uploadPercent.textContent = "100%";

      setTimeout(() => {
        uploadProgress.classList.add("hidden");
      }, 500);
    });

    img.src = e.target.result;
  });

  reader.readAsDataURL(file);
});

// ======================================================
// Draw Receipt
// ======================================================

function drawReceipt(img) {
  const maxWidth = 800;

  const maxHeight = 500;

  let width = img.width;

  let height = img.height;

  if (width > maxWidth) {
    height = height * (maxWidth / width);

    width = maxWidth;
  }

  if (height > maxHeight) {
    width = width * (maxHeight / height);

    height = maxHeight;
  }

  receiptCanvas.width = width;

  receiptCanvas.height = height;

  ctx.clearRect(0, 0, receiptCanvas.width, receiptCanvas.height);

  ctx.drawImage(img, 0, 0, width, height);
}

// ======================================================
// Crop Receipt
// ======================================================

cropReceiptBtn.addEventListener("click", () => {
  if (!receiptImage) {
    return;
  }

  const cropWidth = receiptCanvas.width * 0.8;

  const cropHeight = receiptCanvas.height * 0.8;

  const startX = (receiptCanvas.width - cropWidth) / 2;

  const startY = (receiptCanvas.height - cropHeight) / 2;

  const croppedCanvas = document.createElement("canvas");

  croppedCanvas.width = cropWidth;

  croppedCanvas.height = cropHeight;

  const croppedCtx = croppedCanvas.getContext("2d");

  croppedCtx.drawImage(
    receiptCanvas,

    startX,
    startY,

    cropWidth,
    cropHeight,

    0,
    0,

    cropWidth,
    cropHeight,
  );

  receiptCanvas.width = cropWidth;

  receiptCanvas.height = cropHeight;

  ctx.clearRect(0, 0, receiptCanvas.width, receiptCanvas.height);

  ctx.drawImage(croppedCanvas, 0, 0);

  croppedReceipt = croppedCanvas.toDataURL("image/jpeg", 0.9);
});

// ======================================================
// Remove Receipt
// ======================================================

removeReceiptBtn.addEventListener("click", () => {
  receiptInput.value = "";

  receiptImage = null;

  croppedReceipt = null;

  ctx.clearRect(0, 0, receiptCanvas.width, receiptCanvas.height);

  receiptPreview.classList.add("hidden");
});

// ======================================================
// Get Categories From API
// ======================================================

async function getCategories() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");

    return;
  }

  try {
    const response = await api.get("/categories");

    categories = response.data?.data?.categories || [];

    if (!Array.isArray(categories)) {
      categories = [];
    }

    // Category Filter

    categoryFilter.innerHTML = `
      <option value="all">
        همه دسته‌ها
      </option>
    `;

    categories.forEach((category) => {
      const parentId = getParentId(category);

      if (parentId !== null && parentId !== undefined && parentId !== "") {
        return;
      }

      const option = document.createElement("option");

      option.value = category.id;

      option.textContent = category.name;

      categoryFilter.appendChild(option);
    });

    // Category Options

    categoryOptionsContainer.innerHTML = "";

    categories.forEach((category) => {
      const categoryBtn = document.createElement("button");

      categoryBtn.type = "button";

      categoryBtn.className = "category-option";

      categoryBtn.dataset.categoryId = category.id;

      categoryBtn.innerHTML = `
          <span>
            ${category.name}
          </span>
        `;

      categoryOptionsContainer.appendChild(categoryBtn);
    });
  } catch (error) {
    console.error("Categories Error:", error);

    showToast(
      error.response?.data?.message || "دسته‌بندی‌ها دریافت نشدند.",
      "error",
    );
  }
}

// ======================================================
// Get Transactions From API
// ======================================================

async function getTransactions() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");

    return;
  }

  try {
    const response = await api.get("/transactions");

    transactions = response.data?.data?.transactions || [];

    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    currentTransactionCount = transactions.length;

    filterTransactions();
  } catch (error) {
    console.error("Transactions Error:", error);

    showToast(
      error.response?.data?.message || "تراکنش‌ها دریافت نشدند.",
      "error",
    );
  }
}

// ======================================================
// Infinite Scroll
// ======================================================

async function loadMoreTransactions() {
  if (isLoadingMore) {
    return;
  }

  if (!hasMoreTransactions) {
    return;
  }

  if (transactions.length === currentTransactionCount) {
    hasMoreTransactions = false;

    return;
  }

  try {
    isLoadingMore = true;

    showTransactionLoader();
  } finally {
    isLoadingMore = false;

    hideTransactionLoader();
  }
}

// ======================================================
// Infinite Scroll Listener
// ======================================================

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;

  const windowHeight = window.innerHeight;

  const documentHeight = document.documentElement.scrollHeight;

  const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

  if (distanceFromBottom <= 300) {
    loadMoreTransactions();
  }
});

// ======================================================
// Initial Load
// ======================================================

async function initTransactionsPage() {
  try {
    // Global Loader ON

    showGlobalLoader();

    // Base Currency
    // اول ارز پایه را می‌گیریم تا
    // مبلغ‌ها با سمبل صحیح رندر شوند.

    await loadBaseCurrency();

    // Categories

    await getCategories();

    // Transactions

    await getTransactions();
  } finally {
    // Global Loader OFF

    hideGlobalLoader();
  }
}

initTransactionsPage();
