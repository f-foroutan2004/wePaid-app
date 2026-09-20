import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

// Elements
const quickAddBtn = document.getElementById("quickAddBtn");
const transactionModal = document.querySelector(".transaction-modal");
const transactionForm = document.querySelector(".transaction-form");
const transactionTitle = document.getElementById("transactionTitle");
const transactionAmount = document.getElementById("transactionAmount");
const categoryOptions = document.querySelector(".category-options");
const categoryError = document.querySelector(".categoryError");
const tagOptions = document.querySelector(".tag-options");
const paymentOptions = document.querySelector(".payment-options");
const receiptInput = document.getElementById("receiptInput");
const recurringTransaction = document.getElementById("recurringTransaction");
const recurringFields = document.getElementById("recurringFields");
const recurringFrequency = document.getElementById("recurringFrequency");
const repeatCount = document.getElementById("repeatCount");
const recurringEndDate = document.getElementById("recurringEndDate");
const closeModalBtn = document.querySelector("#closeModal");
const cancelBtn = document.querySelector(".cancel-btn");
const modalOverlay = document.querySelector(".modal-overlay");
const removeReceiptBtn = document.getElementById("removeReceiptBtn");

// State
let categories = [];
let selectedCategoryId = null;
let selectedParentCategoryId = null;
let selectedReceiptFile = null;
let isSubmitting = false;

// Open Modal
function openModal() {
  if (!transactionModal) {
    console.error("Transaction modal not found");
    return;
  }

  transactionModal.classList.remove("hidden");

  loadCategories();
  loadTags();
  loadPaymentMethods();
}

// Close Modal
function closeModal() {
  transactionModal?.classList.add("hidden");

  selectedCategoryId = null;
  selectedParentCategoryId = null;
  selectedReceiptFile = null;

  categoryError?.classList.add("hidden");
}

// Quick Add Button
quickAddBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  openModal();
});

// Close Modal
closeModalBtn?.addEventListener("click", closeModal);
cancelBtn?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", closeModal);

// Recurring
recurringTransaction?.addEventListener("change", () => {
  if (recurringTransaction.checked) {
    recurringFields?.classList.remove("hidden");
  } else {
    recurringFields?.classList.add("hidden");

    if (repeatCount) {
      repeatCount.value = "";
    }

    if (recurringEndDate) {
      recurringEndDate.value = "";
    }
  }
});

// Category Helpers
function getParentId(category) {
  if (!category) return null;

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

function getCategoryChildren(category) {
  if (!category) return [];

  if (Array.isArray(category.children)) {
    return category.children;
  }

  const categoryId = String(category.id);

  return categories.filter((item) => {
    const parentId = getParentId(item);

    return parentId !== null && String(parentId) === categoryId;
  });
}

// Load Categories
async function loadCategories() {
  if (!categoryOptions) return;

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");
      return;
    }

    const response = await api.get("/categories", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    categories = response.data?.data?.categories || [];

    if (!Array.isArray(categories)) {
      categories = [];
    }

    categoryOptions.innerHTML = "";

    categories.forEach((category) => {
      const parentId = getParentId(category);

      if (parentId !== null && parentId !== undefined && parentId !== "") {
        return;
      }

      const button = document.createElement("button");

      button.type = "button";
      button.className = "category-option";
      button.dataset.categoryId = category.id;

      button.innerHTML = `
        <span>${category.name}</span>
      `;

      categoryOptions.appendChild(button);
    });
  } catch (error) {
    showToast(
      error.response?.data?.message || "دریافت دسته‌بندی‌ها با خطا مواجه شد",
      "error",
    );
  }
}

// Category Selection
categoryOptions?.addEventListener("click", (event) => {
  const categoryButton = event.target.closest(".category-option");

  if (!categoryButton) return;

  const categoryId = String(categoryButton.dataset.categoryId);

  const category = categories.find((item) => String(item.id) === categoryId);

  if (!category) return;

  categoryOptions
    .querySelectorAll(".subcategory-dropdown")
    .forEach((item) => item.remove());

  categoryOptions
    .querySelectorAll(".category-option")
    .forEach((item) => item.classList.remove("active"));

  categoryButton.classList.add("active");

  const children = getCategoryChildren(category);

  if (children.length > 0) {
    selectedCategoryId = null;
    selectedParentCategoryId = categoryId;

    categoryError?.classList.remove("hidden");

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
        selectedCategoryId = null;

        categoryError?.classList.remove("hidden");

        return;
      }

      selectedCategoryId = String(selectedId);
      selectedParentCategoryId = categoryId;

      categoryError?.classList.add("hidden");
    });

    categoryButton.parentElement.appendChild(dropdown);

    return;
  }

  selectedCategoryId = categoryId;
  selectedParentCategoryId = null;

  categoryError?.classList.add("hidden");
});

// Load Tags
async function loadTags() {
  if (!tagOptions) return;

  try {
    const token = localStorage.getItem("token");

    if (!token) return;

    const response = await api.get("/tags", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const tags = response.data?.data?.tags || [];

    tagOptions.innerHTML = "";

    tags.forEach((tag) => {
      const label = document.createElement("label");

      label.className = "tag-option";

      label.innerHTML = `
        <input
          type="checkbox"
          value="${tag.id}"
        />

        <span>
          ${tag.name}
        </span>
      `;

      tagOptions.appendChild(label);
    });
  } catch (error) {
    console.error("Tags error:", error);
  }
}

// Load Payment Methods
async function loadPaymentMethods() {
  if (!paymentOptions) return;

  try {
    const token = localStorage.getItem("token");

    if (!token) return;

    const response = await api.get("/payment-methods", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const paymentMethods = response.data?.data?.payment_methods || [];

    paymentOptions.innerHTML = "";

    paymentMethods.forEach((payment) => {
      const label = document.createElement("label");

      label.className = "payment-option";

      label.innerHTML = `
        <input
          type="radio"
          name="payment"
          value="${payment.name}"
        />

        <span>
          ${payment.name}
        </span>
      `;

      paymentOptions.appendChild(label);
    });
  } catch (error) {
    console.error("Payment methods error:", error);
  }
}

// Receipt Upload
receiptInput?.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) {
    selectedReceiptFile = null;
    return;
  }

  selectedReceiptFile = file;

  const receiptPreview = document.getElementById("receiptPreview");

  const canvas = document.getElementById("receiptCanvas");

  if (!canvas) return;

  const context = canvas.getContext("2d");
  const image = new Image();

  image.onload = () => {
    const maxWidth = 500;
    const maxHeight = 500;

    let width = image.width;
    let height = image.height;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);

    context.drawImage(image, 0, 0, width, height);

    receiptPreview?.classList.remove("hidden");

    URL.revokeObjectURL(image.src);
  };

  image.src = URL.createObjectURL(file);
});

// Remove Receipt
removeReceiptBtn?.addEventListener("click", () => {
  selectedReceiptFile = null;

  if (receiptInput) {
    receiptInput.value = "";
  }

  const receiptPreview = document.getElementById("receiptPreview");

  receiptPreview?.classList.add("hidden");

  const canvas = document.getElementById("receiptCanvas");

  if (canvas) {
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
  }
});

// Create Transaction
transactionForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting) return;

  const title = transactionTitle?.value.trim();
  const amount = transactionAmount?.value;

  const type = document.querySelector(
    'input[name="transactionType"]:checked',
  )?.value;

  const paymentMethod =
    document.querySelector('input[name="payment"]:checked')?.value || "";

  const walletId = localStorage.getItem("walletId");

  // Validation
  if (!title) {
    document
      .querySelector(".transactionTitleError")
      ?.classList.remove("hidden");

    return;
  }

  document.querySelector(".transactionTitleError")?.classList.add("hidden");

  if (!amount || +(amount) <= 0) {
    document
      .querySelector(".transactionAmountError")
      ?.classList.remove("hidden");

    return;
  }

  document.querySelector(".transactionAmountError")?.classList.add("hidden");

  if (!selectedCategoryId) {
    categoryError?.classList.remove("hidden");
    return;
  }

  categoryError?.classList.add("hidden");

  if (!walletId) {
    showToast("کیف پول انتخاب نشده است", "error");

    return;
  }

  // Tags
  const selectedTags = [
    ...document.querySelectorAll('.tag-options input[type="checkbox"]:checked'),
  ].map((checkbox) => checkbox.value);

  // Recurring
  const isPeriodic = recurringTransaction?.checked || false;

  const frequency = isPeriodic ? recurringFrequency?.value || "" : "";

  const repeatCountValue =
    isPeriodic && repeatCount?.value ? repeatCount.value : "";

  const endDate =
    isPeriodic && recurringEndDate?.value ? recurringEndDate.value : "";

  // FormData
  const formData = new FormData();

  formData.append("wallet_id", walletId);
  formData.append("category_id", selectedCategoryId);
  formData.append("title", title);
  formData.append("payment_method", paymentMethod);
  formData.append("type", type || "expense");
  formData.append("amount", Number(amount));

  // Receipt
  if (selectedReceiptFile) {
    formData.append("receipt_image", selectedReceiptFile);
  }

  // Recurring
  formData.append("frequency", frequency);

  formData.append("repeat_count", repeatCountValue);

  formData.append("is_periodic", isPeriodic ? "1" : "0");

  formData.append("end_date", endDate);

  // Tags
  selectedTags.forEach((tagId) => {
    formData.append("tag_ids[]", tagId);
  });

  isSubmitting = true;

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("توکن ورود پیدا نشد. دوباره وارد شوید.", "error");

      return;
    }

    await api.post("/transaction/create", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    showToast("تراکنش با موفقیت ثبت شد", "success");

    closeModal();

    // Reset
    transactionForm.reset();

    selectedCategoryId = null;
    selectedParentCategoryId = null;
    selectedReceiptFile = null;

    categoryOptions.innerHTML = "";

    categoryError?.classList.add("hidden");

    recurringFields?.classList.add("hidden");

    const receiptPreview = document.getElementById("receiptPreview");

    receiptPreview?.classList.add("hidden");
    try {
      await loadTransactions();
    } catch (error) {
      console.error("Load transactions error:", error);
    }
  } catch (error) {
    console.error("Create transaction error:", error);

    showToast(
      error.response?.data?.message || "ثبت تراکنش با خطا مواجه شد",
      "error",
    );
  } finally {
    isSubmitting = false;
  }
});
