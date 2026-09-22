import api from "./api.js";
import { showToast } from "../../utils/Toast.js";
import "../../utils/notification.js";
import "../../utils/logOut.js";
import "./walletSelector.js";

// Elements
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
const uploadProgress = document.querySelector(".upload-progress");
const uploadPercent = document.querySelector("#uploadPercent");
const uploadProgressFill = document.querySelector(".upload-progress-fill");
const tagOptionsContainer = document.querySelector(".tag-options");
const paymentOptionsContainer = document.querySelector(".payment-options");
const tagOptions = document.getElementById("tagOptions");
const addTagBtn = document.getElementById("addTagBtn");
const newTagForm = document.getElementById("newTagForm");
const newTagInput = document.getElementById("newTagInput");
const saveTagBtn = document.getElementById("saveTagBtn");
const cancelTagBtn = document.getElementById("cancelTagBtn");
const newTagError = document.getElementById("newTagError");

// State
let selectedCategory = "";
let selectedCategoryId = "";
let selectedParentCategoryId = null;
let categories = [];
let transactions = [];
let tags = [];
let paymentMethods = [];
let editingTransaction = null;
let isLoadingMore = false;
let hasMoreTransactions = true;
let currentTransactionCount = 0;
let baseCurrency = "";
let displayCurrency = null;
let receiptImage = null;
let croppedReceipt = null;
let receiptFile = null;

// Username
const username = localStorage.getItem("userName");

if (usernameElement) {
  usernameElement.textContent = username || "کاربر";
}

// Format Money
function formatMoney(number) {
  const numericNumber = +number || 0;
  const formatted = numericNumber.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });

  const currency = displayCurrency?.symbol || baseCurrency || "";

  if (!currency) {
    return formatted;
  }

  return `${formatted} ${currency}`;
}

// Load Base Currency
async function loadBaseCurrency() {
  try {
    const response = await api.get("/profile");
    const profile = response.data?.data?.profile;

    if (!profile) {
      console.error("اطلاعات پروفایل پیدا نشد.");
      return;
    }

    const profileCurrency = profile.currency;

    if (profileCurrency && typeof profileCurrency === "object") {
      baseCurrency = profileCurrency.symbol || "";

      if (baseCurrency) {
        return;
      }
    }

    const currencyId = profileCurrency?.id ?? null;

    if (currencyId === null || currencyId === undefined || currencyId === "") {
      baseCurrency = "";
      return;
    }

    await loadCurrencyById(currencyId);
  } catch (error) {
    console.error("Base Currency Error:", error);
    baseCurrency = "";
  }
}

// Load Currency By ID
async function loadCurrencyById(currencyId) {
  try {
    const response = await api.get("/currencies");
    const currencies = response.data?.data?.currencies || [];

    if (!Array.isArray(currencies)) {
      baseCurrency = "";
      return;
    }

    const currency = currencies.find((item) => +item.id === +currencyId);

    if (!currency) {
      console.error("ارز پایه پیدا نشد:", currencyId);
      baseCurrency = "";
      return;
    }

    baseCurrency = currency.symbol || "";
  } catch (error) {
    console.error("Currencies Error:", error);
    baseCurrency = "";
  }
}

// Save Button Loading
function showSaveLoader() {
  if (!saveBtn) {
    return;
  }

  saveBtn.disabled = true;
  saveBtn.classList.add("loading");
  const text = saveBtn.querySelector("span");

  if (text) {
    text.textContent = editingTransaction
      ? "در حال ویرایش..."
      : "در حال ذخیره...";
  }
}

function hideSaveLoader() {
  if (!saveBtn) {
    return;
  }

  saveBtn.disabled = false;
  saveBtn.classList.remove("loading");
  const text = saveBtn.querySelector("span");

  if (text) {
    text.textContent = editingTransaction ? "ویرایش تراکنش" : "ذخیره تراکنش";
  }
}

// Skeleton Loader
function showTransactionSkeleton(count = 6) {
  if (!transactionBody) {
    return;
  }

  transactionBody.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const row = document.createElement("tr");
    row.className = "skeleton-row";
    row.innerHTML = `
      <td>
        <span class="skeleton skeleton-short"></span>
      </td>
      <td>
        <span class="skeleton skeleton-long"></span>
      </td>
      <td>
        <span class="skeleton skeleton-medium"></span>
      </td>
      <td>
        <span class="skeleton skeleton-number"></span>
      </td>
      <td>
        <span class="skeleton skeleton-medium"></span>
      </td>
      <td>
        <span class="skeleton skeleton-medium"></span>
      </td>
      <td>
        <span class="skeleton skeleton-actions"></span>
      </td>
    `;

    transactionBody.appendChild(row);
  }
}

// Parent ID
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

// Get Children
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

    const children = getCategoryChildren(category);
    const child = children.find((item) => String(item.id) === id);

    if (child) {
      return child;
    }
  }

  return null;
}

// Find Parent Category
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

// Get Parent Category ID
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

// Category Click
if (categoryOptionsContainer) {
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

    if (children.length > 0) {
      selectedCategory = "";
      selectedCategoryId = "";
      selectedParentCategoryId = categoryId;

      categoryError?.classList.remove("hidden");

      showSubcategories(children, categoryButton);

      return;
    }

    selectedCategory = categoryName;
    selectedCategoryId = categoryId;
    selectedParentCategoryId = null;

    categoryError?.classList.add("hidden");

    const oldDropdown = categoryButton.parentElement.querySelector(
      ".subcategory-dropdown",
    );

    if (oldDropdown) {
      oldDropdown.remove();
    }
  });
}

// Show Subcategories
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

      categoryError?.classList.remove("hidden");

      return;
    }

    const selectedChild = children.find(
      (child) => String(child.id) === String(selectedId),
    );

    if (!selectedChild) {
      return;
    }

    selectedCategory = selectedChild.name;
    selectedCategoryId = String(selectedChild.id);

    selectedParentCategoryId = String(parentButton.dataset.categoryId);

    categoryError?.classList.add("hidden");
  });

  parentButton.parentElement.appendChild(dropdown);
}

// Transaction Helpers
function getTransactionCategoryId(transaction) {
  return (
    transaction.category_id ||
    transaction.categoryId ||
    transaction.category?.id ||
    ""
  );
}

// Transaction Category Name
function getTransactionCategoryName(transaction) {
  if (transaction.category_name) {
    return transaction.category_name;
  }

  if (typeof transaction.category === "string") {
    return transaction.category;
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

// Payment
function getTransactionPayment(transaction) {
  if (!transaction) return "";

  const payment = transaction.payment_method ?? "";

  if (!payment) {
    return "";
  }

  if (typeof payment === "object" && payment !== null) {
    return (
      payment.name ||
      payment.method ||
      payment.payment_method ||
      payment.id ||
      ""
    );
  }

  return String(payment).trim();
}

// Tags
function getTagId(tag) {
  if (!tag) {
    return "";
  }

  if (typeof tag === "object") {
    return tag.id ?? "";
  }

  return tag;
}

function getTagName(tag) {
  if (!tag) {
    return "";
  }

  if (typeof tag === "string") {
    return tag;
  }

  return tag.name || "";
}

function findTagById(tagId) {
  if (tagId === null || tagId === undefined || tagId === "") {
    return null;
  }

  return tags.find((tag) => String(getTagId(tag)) === String(tagId)) || null;
}

function getTransactionTagId(transaction) {
  if (!transaction) return "";

  if (
    transaction.tag_id !== undefined &&
    transaction.tag_id !== null &&
    transaction.tag_id !== ""
  ) {
    return transaction.tag_id;
  }

  if (Array.isArray(transaction.tags) && transaction.tags.length > 0) {
    const firstTag = transaction.tags[0];

    if (typeof firstTag === "object") {
      return firstTag.id ?? firstTag.tag_id ?? firstTag.tagId ?? "";
    }

    return firstTag;
  }

  return "";
}

function getTransactionTag(transaction) {
  if (!transaction) {
    return "";
  }

  if (Array.isArray(transaction.tags) && transaction.tags.length > 0) {
    const tagNames = transaction.tags
      .map((tag) => getTagName(tag))
      .filter(Boolean);

    if (tagNames.length > 0) {
      return tagNames.join("، ");
    }
  }

  if (transaction.tag?.name) {
    return transaction.tag.name;
  }

  const tagId = getTransactionTagId(transaction);

  if (!tagId) {
    return "";
  }

  const tag = findTagById(tagId);
  return getTagName(tag);
}

// Get Tags From API
async function getTags() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");

    return;
  }

  try {
    const response = await api.get("/tags");
    tags = response.data?.data?.tags || [];

    if (!Array.isArray(tags)) {
      tags = [];
    }

    if (tagFilter) {
      tagFilter.innerHTML = `
        <option value="all">
          همه برچسب‌ها
        </option>
      `;

      tags.forEach((tag) => {
        const tagId = getTagId(tag);
        const tagName = getTagName(tag);

        if (!tagId || !tagName) {
          return;
        }

        const option = document.createElement("option");
        option.value = tagId;
        option.textContent = tagName;

        tagFilter.appendChild(option);
      });
    }

    if (tagOptionsContainer) {
      tagOptionsContainer.innerHTML = "";

      tags.forEach((tag) => {
        const tagId = getTagId(tag);
        const tagName = getTagName(tag);

        if (!tagId || !tagName) {
          return;
        }

        const label = document.createElement("label");

        label.className = "tag-option";

        label.innerHTML = `
          <input
            type="checkbox"
            value="${tagId}"
            data-tag-id="${tagId}"
          />

          <span>
            ${tagName}
          </span>
        `;

        tagOptionsContainer.appendChild(label);
      });
    }
  } catch (error) {
    showToast(
      error.response?.data?.message || "برچسب‌ها دریافت نشدند.",
      "error",
    );
  }
}

// Tag Selection
if (tagOptionsContainer) {
  tagOptionsContainer.addEventListener("change", (event) => {
    const input = event.target.closest('.tag-option input[type="checkbox"]');

    if (!input) {
      return;
    }

    const allInputs = tagOptionsContainer.querySelectorAll(
      'input[type="checkbox"]',
    );

    allInputs.forEach((item) => {
      if (item !== input) {
        item.checked = false;
      }
    });
  });
}

// Get Payment Methods
async function getPaymentMethods() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");

    return;
  }

  try {
    const response = await api.get("/payment-methods");
    paymentMethods = response.data?.data?.payment_methods || [];

    if (!Array.isArray(paymentMethods)) {
      paymentMethods = [];
    }

    if (paymentFilter) {
      paymentFilter.innerHTML = `
        <option value="all">
          همه روش‌های پرداخت
        </option>
      `;

      paymentMethods.forEach((method) => {
        if (!method) {
          return;
        }

        const methodId =
          typeof method === "object"
            ? (method.id ??
              method.payment_method_id ??
              method.paymentMethodId ??
              "")
            : method;

        const methodName =
          typeof method === "string" ? method : method.name || "";

        if (!methodName) {
          return;
        }

        const option = document.createElement("option");
        option.value = methodId || methodName;
        option.textContent = methodName;
        option.dataset.name = methodName;

        paymentFilter.appendChild(option);
      });
    }

    if (paymentOptionsContainer) {
      paymentOptionsContainer.innerHTML = "";
      paymentMethods.forEach((method) => {
        if (!method) {
          return;
        }

        const methodId =
          typeof method === "object"
            ? (method.id ??
              method.payment_method_id ??
              method.paymentMethodId ??
              "")
            : method;

        const methodName =
          typeof method === "string" ? method : method.name || "";

        if (!methodName) {
          return;
        }

        const label = document.createElement("label");
        label.className = "payment-option";
        const paymentValueMap = {
          نقدی: "cash",
          کارت: "card",
          آنلاین: "online",
          "انتقال بانکی": "bank_transfer",
        };

        const paymentValue = paymentValueMap[methodName] || methodName;

        label.innerHTML = `
          <input
            type="radio"
            name="payment"
            value="${paymentValue}"
            data-payment-id="${methodId || ""}"
          />
          <span>
            ${methodName}
          </span>
        `;

        paymentOptionsContainer.appendChild(label);
      });
    }
  } catch (error) {
    showToast(error.response?.data?.message || "روش‌های پرداخت دریافت نشدند.");
  }
}

// Date Helper
function getTransactionDate(transaction) {
  const date = transaction.created_at || "";

  if (!date) {
    return "";
  }
  return String(date).split(" ")[0].split("T")[0];
}

// Recurring Helpers
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

// Show Transactions
function showTransactions(transactionList) {
  if (!transactionBody) {
    return;
  }

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
    const title = transaction.title;
    const displayAmountValue = +transaction.display_amount || 0;
    const type = transaction.type || "expense";
    const categoryName = getTransactionCategoryName(transaction);
    const categoryId = getTransactionCategoryId(transaction);
    const payment = getTransactionPayment(transaction);
    const tag = getTransactionTag(transaction);
    const tagId = getTransactionTagId(transaction);
    const date = getTransactionDate(transaction);

    const displayAmount =
      type === "expense"
        ? Math.abs(displayAmountValue)
        : Math.abs(displayAmountValue);

    const formattedAmount = formatMoney(displayAmount);
    const amountClass = type === "expense" ? "expense-amount" : "income-amount";

    let month = "all";

    if (date) {
      const dateObject = new Date(date);

      if (!isNaN(dateObject.getTime())) {
        month = String(dateObject.getMonth() + 1);
      }
    }

    row.dataset.id = transaction.id || "";
    row.dataset.month = month;
    row.dataset.categoryId = categoryId;
    row.dataset.category = categoryName;
    row.dataset.tag = tag;
    row.dataset.tagId = tagId;
    row.dataset.payment = payment;
    row.dataset.amount = displayAmount;
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
        <td class="${amountClass}">
          ${formattedAmount}
        </td>
        <td>
          ${tag || "-"}
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

// Filter + Sort
function filterTransactions() {
  const searchValue = searchInput?.value.trim().toLowerCase() || "";
  const selectedMonth = monthFilter?.value || "all";
  const selectedCategoryFilter = categoryFilter?.value || "all";
  const selectedTag = tagFilter?.value || "all";
  const selectedPayment = paymentFilter?.value || "all";
  const selectedSort = sortFilter?.value || "";
  const paymentNameMap = {
    cash: "نقدی",
    card: "کارت",
    online: "آنلاین",
    bank_transfer: "انتقال بانکی",
  };

  let filteredTransactions = transactions.filter((transaction) => {
    const title = transaction.title;
    const date = getTransactionDate(transaction);
    const categoryId = getTransactionCategoryId(transaction);
    const transactionTagId = getTransactionTagId(transaction);
    const paymentValue = transaction.payment_method ?? "";

    const payment = getTransactionPayment(transaction);

    let paymentName = payment;

    if (typeof paymentValue === "string") {
      paymentName = paymentNameMap[paymentValue.toLowerCase()] || paymentValue;
    }

    let month = "all";

    if (date) {
      const dateObject = new Date(date);

      if (!isNaN(dateObject.getTime())) {
        month = String(dateObject.getMonth() + 1);
      }
    }

    const matchesSearch = title.toString().toLowerCase().includes(searchValue);

    const matchesMonth =
      selectedMonth === "all" ||
      selectedMonth === "" ||
      month === selectedMonth;

    const parentCategoryId = getParentCategoryId(categoryId);

    const matchesCategory =
      selectedCategoryFilter === "all" ||
      selectedCategoryFilter === "" ||
      String(categoryId) === String(selectedCategoryFilter) ||
      String(parentCategoryId) === String(selectedCategoryFilter);

    const matchesTag =
      selectedTag === "all" ||
      selectedTag === "" ||
      String(transactionTagId) === String(selectedTag);

    const matchesPayment =
      selectedPayment === "all" ||
      selectedPayment === "" ||
      paymentName === selectedPayment ||
      String(paymentValue) === String(selectedPayment);

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
    const amountA = Math.abs(+a.display_amount || 0);
    const amountB = Math.abs(+b.display_amount || 0);

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

// Open Modal
function openModal() {
  transactionModal?.classList.remove("hidden");
  modalContent?.classList.add("animate");
}

// Close Modal
function closeModal() {
  transactionModal?.classList.add("hidden");
  modalContent?.classList.remove("animate");
}

// Reset Category
function resetCategorySelection() {
  selectedCategory = "";
  selectedCategoryId = "";
  selectedParentCategoryId = null;

  if (!categoryOptionsContainer) {
    return;
  }

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

  categoryError?.classList.add("hidden");
}

// Reset Tags
function resetTagSelection() {
  if (!tagOptionsContainer) {
    return;
  }

  tagOptionsContainer
    .querySelectorAll('input[type="checkbox"]')
    .forEach((input) => {
      input.checked = false;
    });
}

// Reset Payment
function resetPaymentSelection() {
  if (!paymentOptionsContainer) {
    return;
  }

  paymentOptionsContainer
    .querySelectorAll('input[name="payment"]')
    .forEach((input) => {
      input.checked = false;
    });
}

// Create New Transaction
async function createNewTransaction(e) {
  e.preventDefault();

  const title = document.getElementById("transactionTitle")?.value.trim();

  const rawAmount = transactionAmount.value.replace(/,/g, "").trim();

  const amount = +rawAmount;

  const selectedPayment = document.querySelector(
    'input[name="payment"]:checked',
  );

  const paymentMethod = selectedPayment?.value || "";

  const token = localStorage.getItem("token");
  const walletId = localStorage.getItem("walletId");

  // -----------------------------
  // Validation
  // -----------------------------

  if (!title) {
    showToast("عنوان تراکنش را وارد کنید.", "error");
    return;
  }

  if (!amount || amount <= 0) {
    showToast("مبلغ تراکنش را وارد کنید.", "error");
    return;
  }

  if (!selectedCategoryId) {
    showToast("دسته‌بندی تراکنش را انتخاب کنید.", "error");
    return;
  }

  if (!paymentMethod) {
    showToast("روش پرداخت را انتخاب کنید.", "error");
    return;
  }

  if (!walletId) {
    showToast("کیف پول انتخاب نشده است.", "error");
    return;
  }

  if (!token) {
    showToast("لطفاً دوباره وارد حساب شوید.", "error");
    return;
  }

  showSaveLoader();

  try {
    const type =
      document.querySelector('input[name="transactionType"]:checked')?.value ||
      "expense";

    const selectedTagInput = document.querySelector(
      '.tag-option input[type="checkbox"]:checked',
    );

    const selectedTagId = selectedTagInput?.value || "";

    // -----------------------------
    // FormData
    // -----------------------------

    const transactionData = new FormData();

    transactionData.append("wallet_id", walletId);

    transactionData.append("category_id", selectedCategoryId);

    transactionData.append("title", title);

    transactionData.append("payment_method", paymentMethod);

    transactionData.append("type", type);

    transactionData.append("amount", amount);

    // -----------------------------
    // Tag
    // -----------------------------

    if (selectedTagId) {
      transactionData.append("tag_ids[]", selectedTagId);
    }

    // -----------------------------
    // Receipt Image
    // -----------------------------

    if (croppedReceipt instanceof File) {
      transactionData.append(
        "receipt_image",
        croppedReceipt,
        croppedReceipt.name,
      );
    } else if (receiptFile instanceof File) {
      transactionData.append("receipt_image", receiptFile, receiptFile.name);
    }

    // -----------------------------
    // Recurring Transaction
    // -----------------------------

    const isPeriodic = recurringTransaction?.checked || false;

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

    // -----------------------------
    // Create Transaction
    // -----------------------------

    let response;
    try {
      response = await api.post("/transaction/create", transactionData);
    } catch (error) {
      const responseData = error.response?.data?.data;

      // -----------------------------
      // Over Budget Confirmation
      // -----------------------------

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

        if (!confirmed) {
          closeModal();
          return;
        }

        showSaveLoader();

        transactionData.append("confirm_over_budget", "true");

        response = await api.post("/transaction/create", transactionData);
      } else {
        throw error;
      }
    }

    // -----------------------------
    // Success
    // -----------------------------

    if (response?.data?.success !== false) {
      await getTransactions();

      showToast(
        response?.data?.message || "تراکنش با موفقیت ثبت شد.",
        "success",
      );

      closeModal();

      resetRecurringFields();
      resetTagSelection();
      resetPaymentSelection();

      // Reset receipt
      receiptImage = null;
      receiptFile = null;
      croppedReceipt = null;

      if (receiptInput) {
        receiptInput.value = "";
      }
    }
  } catch (error) {
    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "ثبت تراکنش انجام نشد.",
      "error",
    );
  } finally {
    hideSaveLoader();
  }
}

// Delete + Edit
if (transactionBody) {
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
        showToast("شناسه تراکنش پیدا نشد.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        showToast("توکن ورود پیدا نشد. دوباره وارد شوید.");
        return;
      }

      try {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
          `;

        await api.delete(`/transaction/delete/${transactionId}`);
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
        showToast(error.response?.data?.message || "حذف تراکنش انجام نشد.");

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
}

// Edit Modal
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
  transactionModalTitle.value = transaction.title;

  // Amount
  transactionModalAmount.value = Math.abs(
    +transaction.amount || 0,
  ).toLocaleString("en-US");

  // Category
  resetCategorySelection();

  const categoryId = getTransactionCategoryId(transaction);
  const categoryName = getTransactionCategoryName(transaction);
  const parentCategory = findParentCategory(categoryId);

  if (categoryOptionsContainer) {
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
            categoryError?.classList.remove("hidden");

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
              categoryError?.classList.add("hidden");
            }
          } else {
            selectedCategory = categoryName;
            selectedCategoryId = String(categoryId);
            selectedParentCategoryId = null;
            categoryError?.classList.add("hidden");
          }
        }
      });
  }

  const paymenttt = getTransactionPayment(transaction);

  // Transaction Type
  const transactionType = transaction.type || "expense";
  const typeRadio = document.querySelector(
    `input[name="transactionType"][value="${transactionType}"]`,
  );

  if (typeRadio) {
    typeRadio.checked = true;
  }

  // Payment
  const payment = getTransactionPayment(transaction);

  if (paymentOptionsContainer) {
    paymentOptionsContainer
      .querySelectorAll('input[name="payment"]')
      .forEach((input) => {
        input.checked = String(input.value) === String(payment);
      });
  }

  // Tag
  const transactionTagId = getTransactionTagId(transaction);

  if (tagOptionsContainer) {
    tagOptionsContainer
      .querySelectorAll('input[type="checkbox"]')
      .forEach((input) => {
        input.checked = String(input.value) === String(transactionTagId);
      });
  }

  // Recurring
  const isPeriodic =
    transaction.is_periodic === true ||
    transaction.is_periodic === 1 ||
    transaction.is_periodic === "1" ||
    transaction.is_periodic === "true";

  if (recurringTransaction) {
    recurringTransaction.checked = isPeriodic;

    if (recurringFields) {
      recurringFields.classList.toggle("hidden", !isPeriodic);
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
  const repeatCountInput = document.getElementById("repeatCount");

  if (repeatCountInput) {
    repeatCountInput.value = transaction.repeat_count || "";
  }

  // End Date
  const endDateInput = document.getElementById("recurringEndDate");

  if (endDateInput) {
    endDateInput.value = transaction.end_date || "";
  }

  openModal();

  saveBtn.onclick = (e) => {
    e.preventDefault();
    updateTransaction(row);
  };
}

// Update Transaction
async function updateTransaction(row) {
  const newTitle = transactionModalTitle.value.trim();
  const amount = +transactionAmount.value.replace(/,/g, "");

  if (!newTitle || !amount || !selectedCategoryId) {
    showToast("لطفاً اطلاعات تراکنش را کامل کنید.", "error");

    return;
  }

  const transactionType = document.querySelector(
    'input[name="transactionType"]:checked',
  )?.value;

  if (!transactionType) {
    showToast("نوع تراکنش را انتخاب کنید.", "error");

    return;
  }

  const selectedPayment = document.querySelector(
    'input[name="payment"]:checked',
  );

  const payment = selectedPayment?.value || "";
  if (!payment) {
    showToast("لطفاً روش پرداخت را انتخاب کنید.", "error");

    return;
  }

  const finalAmount = Math.abs(amount);
  const transactionId = editingTransaction?.id;
  if (!transactionId) {
    showToast("شناسه تراکنش پیدا نشد.", "error");

    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");

    return;
  }

  const transactionDate =
    getTransactionDate(editingTransaction) ||
    new Date().toISOString().split("T")[0];

  const selectedTag = document.querySelector(
    '.tag-option input[type="checkbox"]:checked',
  );

  const tagId = selectedTag?.value || null;
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
      showToast("لطفاً تعداد تکرار را وارد کنید.");
      return;
    }

    if (!endDate) {
      showToast("لطفاً تاریخ پایان را انتخاب کنید.");
      return;
    }
  }

  const transactionData = {
    category_id: +selectedCategoryId,
    title: newTitle,
    payment_method: payment,
    type: transactionType,
    amount: finalAmount,
    transaction_date: transactionDate,
    frequency,
    repeat_count: repeatCount,
    is_periodic: isPeriodic,
    end_date: endDate,
    tag_ids: tagId ? [Number(tagId)] : [],
  };

  try {
    showSaveLoader();

    await api.put(`/transaction/update/${transactionId}`, transactionData);
    await getTransactions();
    showToast("تراکنش با موفقیت ویرایش شد.", "success");

    transactionModalTitle.value = "";
    transactionModalAmount.value = "";

    resetCategorySelection();
    resetTagSelection();
    resetPaymentSelection();
    resetRecurringFields();

    editingTransaction = null;
    saveBtn.onclick = createNewTransaction;

    closeModal();
  } catch (error) {
    showToast(error.response?.data?.message || "ویرایش تراکنش انجام نشد.");
  } finally {
    hideSaveLoader();
  }
}

// Events
if (searchInput) {
  searchInput.addEventListener("input", filterTransactions);
}

if (monthFilter) {
  monthFilter.addEventListener("change", filterTransactions);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", filterTransactions);
}

if (tagFilter) {
  tagFilter.addEventListener("change", filterTransactions);
}

if (paymentFilter) {
  paymentFilter.addEventListener("change", filterTransactions);
}

if (sortFilter) {
  sortFilter.addEventListener("change", filterTransactions);
}

// Add Transaction=
if (addTransactionBtn) {
  addTransactionBtn.addEventListener("click", () => {
    editingTransaction = null;

    saveBtn.onclick = createNewTransaction;

    transactionModalTitle.value = "";
    transactionModalAmount.value = "";
    resetCategorySelection();
    resetRecurringFields();
    resetTagSelection();
    resetPaymentSelection();

    openModal();
    receiptPreview.classList.add("hidden");
  });
}

// Close Buttons
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", closeModal);
}

// Recurring Transaction
if (recurringTransaction) {
  recurringTransaction.addEventListener("change", () => {
    if (recurringTransaction.checked) {
      recurringFields?.classList.remove("hidden");
    } else {
      recurringFields?.classList.add("hidden");
    }
  });
}

// Receipt Upload
const ctx = receiptCanvas?.getContext("2d");
// File Selected
if (receiptInput) {
  receiptInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // فایل اصلی را نگه می‌داریم تا در صورت نیاز مستقیم ارسال شود
    receiptFile = file;

    // اگر قبلاً عکس کراپ شده بود، پاک می‌کنیم
    croppedReceipt = null;

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        receiptImage = img;

        drawReceipt(img);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// Draw Receipt
function drawReceipt(img) {
  if (!receiptCanvas || !ctx) {
    return;
  }

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

// Crop Receipt
if (cropReceiptBtn) {
  cropReceiptBtn.addEventListener("click", () => {
    if (!receiptImage || !receiptCanvas || !ctx) {
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

    // نمایش تصویر کراپ‌شده
    receiptCanvas.width = cropWidth;
    receiptCanvas.height = cropHeight;

    ctx.clearRect(0, 0, receiptCanvas.width, receiptCanvas.height);

    ctx.drawImage(croppedCanvas, 0, 0);

    // تبدیل Canvas به File واقعی
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast("خطا در آماده‌سازی تصویر.", "error");

          return;
        }

        croppedReceipt = new File([blob], "receipt.jpg", {
          type: "image/jpeg",
        });
      },
      "image/jpeg",
      0.9,
    );
  });
}

// Remove Receipt
if (removeReceiptBtn) {
  removeReceiptBtn.addEventListener("click", () => {
    if (receiptInput) {
      receiptInput.value = "";
    }

    receiptImage = null;
    croppedReceipt = null;

    if (ctx && receiptCanvas) {
      ctx.clearRect(0, 0, receiptCanvas.width, receiptCanvas.height);
    }

    receiptPreview?.classList.add("hidden");
  });
}

// Get Categories From API
async function getCategories() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.");
    return;
  }

  try {
    const response = await api.get("/categories");
    categories = response.data?.data?.categories || [];

    if (!Array.isArray(categories)) {
      categories = [];
    }

    if (categoryFilter) {
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
    }

    if (categoryOptionsContainer) {
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
    }
  } catch (error) {
    showToast(error.response?.data?.message || "دسته‌بندی‌ها دریافت نشدند.");
  }
}

// Get Transactions From API
async function getTransactions() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");
    return;
  }

  const walletId = localStorage.getItem("walletId");

  if (!walletId) {
    transactions = [];
    currentTransactionCount = 0;
    hasMoreTransactions = false;

    showTransactions([]);

    showToast("کیف پول انتخاب نشده است.", "error");
    return;
  }

  showTransactionSkeleton();

  try {
    const response = await api.get("/transactions", {
      params: {
        wallet_id: walletId,
      },
    });

    const data = response.data?.data;

    let fetchedTransactions = data?.transactions || [];

    if (!Array.isArray(fetchedTransactions)) {
      fetchedTransactions = [];
    }

    // فقط تراکنش‌های کیف پول فعال
    transactions = fetchedTransactions.filter((transaction) => {
      const transactionWalletId =
        transaction.wallet_id ??
        transaction.walletId ??
        transaction.wallet?.id ??
        transaction.wallet?.wallet_id;

      return String(transactionWalletId) === String(walletId);
    });

    displayCurrency = data?.display_currency || null;

    if (displayCurrency) {
      baseCurrency =
        displayCurrency.symbol ||
        displayCurrency.currency_symbol ||
        displayCurrency.currencySymbol ||
        baseCurrency ||
        "";
    }

    currentTransactionCount = transactions.length;

    hasMoreTransactions = true;

    filterTransactions();
  } catch (error) {
    console.error("Get transactions error:", error);

    transactions = [];
    currentTransactionCount = 0;
    hasMoreTransactions = false;

    transactionBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="no-result"
        >
          دریافت تراکنش‌ها با خطا مواجه شد.
        </td>
      </tr>
    `;

    showToast(
      error.response?.data?.message || "تراکنش‌ها دریافت نشدند.",
      "error",
    );
  }
}

// Infinite Scroll
async function loadMoreTransactions() {
  if (isLoadingMore || !hasMoreTransactions) {
    return;
  }
}

// Infinite Scroll Listener
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

  if (distanceFromBottom <= 300) {
    loadMoreTransactions();
  }
});

// Initial Load
async function initTransactionsPage() {
  showTransactionSkeleton();
  await loadBaseCurrency();
  await getCategories();
  await getTags();
  await getPaymentMethods();
  await getTransactions();
}

// Export Transactions
const exportWrapper = document.querySelector(".export-wrapper");
const exportBtn = document.getElementById("exportBtn");
const exportMenu = document.getElementById("exportMenu");
const exportOptions = document.querySelectorAll(".export-option");
const exportUrls = {
  pdf: "https://wepaid.ir/reports/transactions/pdf-link",
  csv: "https://wepaid.ir/reports/transactions/csv-link",
};

// Open / Close Export Menu
exportBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  exportWrapper.classList.toggle("active");
});

// Download Selected Format
exportOptions.forEach((option) => {
  option.addEventListener("click", async () => {
    const format = option.dataset.format;
    const url = exportUrls[format];
    if (!url) {
      return;
    }

    try {
      option.disabled = true;
      const originalHTML = option.innerHTML;
      option.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            در حال آماده‌سازی...
          `;

      const response = await api.get(url);

      if (!response.data?.success) {
        throw new Error("خطا در دریافت فایل");
      }

      const downloadUrl = response.data?.data?.download_url;

      if (!downloadUrl) {
        throw new Error("لینک دانلود دریافت نشد");
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`فایل ${format.toUpperCase()} با موفقیت آماده شد`, "success");

      exportWrapper.classList.remove("active");
      option.innerHTML = originalHTML;
      option.disabled = false;
    } catch (error) {
      showToast("دریافت خروجی با خطا مواجه شد", "error");
      option.disabled = false;

      if (format === "pdf") {
        option.innerHTML = `
              <i class="fas fa-file-pdf"></i>
              دریافت PDF
            `;
      } else {
        option.innerHTML = `
              <i class="fas fa-file-csv"></i>
              دریافت CSV
            `;
      }
    }
  });
});

// Close Export Menu
document.addEventListener("click", (e) => {
  if (exportWrapper && !exportWrapper.contains(e.target)) {
    exportWrapper.classList.remove("active");
  }
});

addTagBtn.addEventListener("click", () => {
  newTagForm.classList.remove("hidden");
  addTagBtn.classList.add("hidden");

  newTagInput.value = "";
  newTagError.classList.add("hidden");

  newTagInput.focus();
});

cancelTagBtn.addEventListener("click", () => {
  newTagForm.classList.add("hidden");
  addTagBtn.classList.remove("hidden");

  newTagInput.value = "";
  newTagError.classList.add("hidden");
});

saveTagBtn.addEventListener("click", async () => {
  const tagName = newTagInput.value.trim();

  if (!tagName) {
    newTagError.textContent = "نام برچسب را وارد کنید";
    newTagError.classList.remove("hidden");
    newTagInput.focus();
    return;
  }

  try {
    saveTagBtn.disabled = true;

    const response = await api.post("/tag/create", {
      name: tagName,
    });

    const createdTag =
      response.data?.data?.tag || response.data?.tag || response.data?.data;

    if (!createdTag) {
      return;
    }

    // اضافه کردن تگ جدید به لیست
    addTagToUI(createdTag);

    // بستن فرم
    newTagForm.classList.add("hidden");
    addTagBtn.classList.remove("hidden");

    newTagInput.value = "";
    newTagError.classList.add("hidden");
  } catch (error) {
    console.error("Create tag error:", error);

    newTagError.textContent =
      error.response?.data?.message || "خطا در ایجاد برچسب";

    newTagError.classList.remove("hidden");
  } finally {
    saveTagBtn.disabled = false;
  }
});

function addTagToUI(tag) {
  const tagId = tag.id;
  const tagName = tag.name;

  const label = document.createElement("label");
  label.className = "tag-option";

  label.innerHTML = `
    <input
      type="checkbox"
      name="tags"
      value="${tagId}"
      checked
    />

    <span>
      ${tagName}
    </span>
  `;

  tagOptions.appendChild(label);
}

transactionAmount.addEventListener("input", function () {
  let value = this.value;

  // حذف کاماهای قبلی
  value = value.replace(/,/g, "");

  // فقط عدد و نقطه
  value = value.replace(/[^\d.]/g, "");

  // فقط یک نقطه مجاز باشد
  const firstDotIndex = value.indexOf(".");

  if (firstDotIndex !== -1) {
    value =
      value.slice(0, firstDotIndex + 1) +
      value.slice(firstDotIndex + 1).replace(/\./g, "");
  }

  // جدا کردن قسمت صحیح و اعشار
  let [integerPart, decimalPart] = value.split(".");

  // اگر کاربر فقط نقطه زده
  if (integerPart === "") {
    integerPart = "0";
  }

  // حذف صفرهای اضافی ابتدای عدد
  if (integerPart.length > 1) {
    integerPart = integerPart.replace(/^0+/, "") || "0";
  }

  // فرمت هزارگان قسمت صحیح
  integerPart = Number(integerPart).toLocaleString("en-US");

  // اگر نقطه وجود داشته، حتماً نگهش دار
  if (value.includes(".")) {
    this.value =
      integerPart + "." + (decimalPart !== undefined ? decimalPart : "");
  } else {
    this.value = integerPart;
  }
});
// Init
initTransactionsPage();
