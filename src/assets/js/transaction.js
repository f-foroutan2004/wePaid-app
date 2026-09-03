const usernameElement = document.querySelector("#headerUsername");
const searchInput = document.getElementById("search");
const monthFilter = document.getElementById("monthFilter");
const categoryFilter = document.getElementById("categoryFilter");
const tagFilter = document.getElementById("tagFilter");
const paymentFilter = document.getElementById("paymentFilter");
const sortFilter = document.getElementById("sortFilter");
// const filterBtn = document.getElementById("filterBtn");
const transactionBody = document.getElementById("transactionBody");
const addTransactionBtn = document.querySelector(".add-btn");
const closeModalBtn = document.querySelector(".close-modal");
const transactionModal = document.querySelector(".transaction-modal");
const cancelBtn = document.querySelector(".cancel-btn");
const saveBtn = document.querySelector(".save-btn");
const transactionModalTitle = document.getElementById("transactionTitle");
const transactionModalAmount = document.getElementById("transactionAmount");
const categoryOptions = document.querySelectorAll(".category-option");
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
const categoryError = document.querySelector(".categoryError");
const uploadProgress = document.querySelector(".upload-progress");
const uploadPercent = document.querySelector("#uploadPercent");
const uploadProgressFill = document.querySelector(".upload-progress-fill");

// Username
const username = localStorage.getItem("userName");
usernameElement.textContent = username || "کاربر";

// Categories
let selectedCategory = "";
categoryOptions.forEach((category) => {
  category.addEventListener("click", () => {
    categoryOptions.forEach((item) => {
      item.classList.remove("active");
    });

    category.classList.add("active");

    selectedCategory = category.querySelector("span").textContent.trim();
  });
});

// Transactions Array
let transactions = [...transactionBody.querySelectorAll("tr")];

// Show Transactions
function showTransactions(transactionList) {
  transactionBody.innerHTML = "";

  if (transactionList.length === 0) {
    transactionBody.innerHTML = `
      <tr>
        <td
          class="no-result"
          colspan="6"
          style="color: var(--very-pink)"
        >
          تراکنشی پیدا نشد
        </td>
      </tr>
    `;
    return;
  }

  transactionList.forEach((transaction, index) => {
    transaction.querySelector(".listId").textContent = index + 1;
    transactionBody.append(transaction);
  });
}

// Filter-Sort function
function filterTransactions() {
  const searchValue = searchInput.value.trim();
  const selectedMonth = monthFilter.value;
  const selectedCategoryFilter = categoryFilter.value;
  const selectedTag = tagFilter.value;
  const selectedPayment = paymentFilter.value;
  const selectedSort = sortFilter.value;

  // Filter
  let filteredTransactions = transactions.filter((transaction) => {
    const title = transaction.children[1].textContent.trim();
    const month = transaction.dataset.month;
    const category = transaction.dataset.category;
    const tag = transaction.dataset.tag;
    const payment = transaction.dataset.payment;

    const matchesSearch = title.includes(searchValue);
    const matchesMonth = selectedMonth === "all" || month === selectedMonth;
    const matchesCategory =
      selectedCategoryFilter === "all" || category === selectedCategoryFilter;
    const matchesTag = selectedTag === "all" || tag === selectedTag;
    const matchesPayment =
      selectedPayment === "all" || payment === selectedPayment;
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
    const amountA = Number(a.dataset.amount);
    const amountB = Number(b.dataset.amount);

    if (selectedSort === "highest") {
      return amountB - amountA;
    }
    if (selectedSort === "lowest") {
      return amountA - amountB;
    }

    return 0;
  });

  // Show
  showTransactions(filteredTransactions);
}

//open Modal
function openModal() {
  transactionModal.classList.remove("hidden");
  modalContent.classList.add("animate");
}

//close modal
function closeModal() {
  transactionModal.classList.add("hidden");
  modalContent.classList.remove("animate");
}

// Create New Transaction
function createNewTransaction(e) {
  e.preventDefault();
  const newTitle = transactionModalTitle.value.trim();
  const amount = +transactionModalAmount.value;

  // validation
  if (!newTitle) {
    transactionTitleError.classList.remove("hidden");
  } else {
    transactionTitleError.classList.add("hidden");
  }
  if (!amount) {
    transactionAmountError.classList.remove("hidden");
  } else {
    transactionAmountError.classList.add("hidden");
  }
  if (!selectedCategory) {
    categoryError.classList.remove("hidden");
    return;
  } else {
    categoryError.classList.add("hidden");
  }

  const transactionType = document.querySelector(
    'input[name="transactionType"]:checked',
  ).value;

  const finalAmount =
    transactionType === "expense" ? -Math.abs(amount) : Math.abs(amount);

  let categoryValue = "food";

  if (selectedCategory === "غذا") {
    categoryValue = "food";
  } else if (selectedCategory === "حمل و نقل") {
    categoryValue = "transport";
  } else if (selectedCategory === "خرید") {
    categoryValue = "shopping";
  } else if (selectedCategory === "خانه") {
    categoryValue = "home";
  } else if (selectedCategory === "درآمد") {
    categoryValue = "salary";
  }

  const payment = document.querySelector('input[name="payment"]:checked').value;
  const selectedTag = document.querySelector(".tag-option input:checked");
  const tag = selectedTag ? selectedTag.value : "daily";

  const newTransaction = document.createElement("tr");
  newTransaction.dataset.month = "all";
  newTransaction.dataset.category = categoryValue;
  newTransaction.dataset.tag = tag;
  newTransaction.dataset.payment = payment;
  newTransaction.dataset.amount = finalAmount;
  newTransaction.innerHTML = `
    <td class="listId"></td>
    <td>${newTitle}</td>
    <td>${selectedCategory}</td>
    <td>
      ${finalAmount} $
    </td>
    <td>امروز</td>
    <td>
      <button class="delete-btn">
        <i class="fas fa-trash"></i>
      </button>

      <button class="edit-btn">
        <i class="fas fa-edit"></i>
      </button>
    </td>
  `;

  // Add to array
  transactions.push(newTransaction);

  closeModal();

  // Reset form
  transactionModalTitle.value = "";
  transactionModalAmount.value = "";
  selectedCategory = "";
  categoryOptions.forEach((item) => {
    item.classList.remove("active");
  });

  // Show + sort
  filterTransactions();
}

// Delete + Edit
transactionBody.addEventListener("click", (event) => {
  // Delete
  const deleteBtn = event.target.closest(".delete-btn");
  if (deleteBtn) {
    const row = deleteBtn.closest("tr");
    row.classList.add("slide-out");
    setTimeout(() => {
      row.remove();
      transactions = transactions.filter((transaction) => transaction !== row);
    }, 400);
    return;
  }

  // Edit
  const editBtn = event.target.closest(".edit-btn");
  if (editBtn) {
    const row = editBtn.closest("tr");
    openEditModal(row);
  }
});

// Edit Modal
function openEditModal(row) {
  const title = row.children[1].textContent.trim();
  const amount = Math.abs(+row.dataset.amount);
  transactionModalTitle.value = title;
  transactionModalAmount.value = amount;

  categoryOptions.forEach((category) => {
    category.classList.remove("active");
    const text = category.querySelector("span").textContent.trim();
    if (text === row.children[2].textContent.trim()) {
      category.classList.add("active");
      selectedCategory = text;
    }
  });

  const transactionType = +row.dataset.amount >= 0 ? "income" : "expense";
  const typeRadio = document.querySelector(
    `input[name="transactionType"][value="${transactionType}"]`,
  );

  if (typeRadio) {
    typeRadio.checked = true;
  }

  transactionModal.classList.remove("hidden");
  modalContent.classList.add("animate");
  
  saveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    updateTransaction(row);
  });
}

// Update Transaction
function updateTransaction(row) {
  const newTitle = transactionModalTitle.value.trim();
  const amount = +transactionModalAmount.value;

  if (!newTitle || !amount || !selectedCategory) {
    alert("لطفاً اطلاعات تراکنش را کامل کنید.");
    return;
  }
  const transactionType = document.querySelector(
    'input[name="transactionType"]:checked',
  ).value;

  const finalAmount =
    transactionType === "expense" ? -Math.abs(amount) : Math.abs(amount);

  row.children[1].textContent = newTitle;
  row.children[2].textContent = selectedCategory;
  row.children[3].textContent = `${finalAmount} $`;

  // Update data
  row.dataset.amount = finalAmount;

  // Update category
  if (selectedCategory === "غذا") {
    row.dataset.category = "food";
  } else if (selectedCategory === "حمل و نقل") {
    row.dataset.category = "transport";
  } else if (selectedCategory === "خرید") {
    row.dataset.category = "shopping";
  } else if (selectedCategory === "خانه") {
    row.dataset.category = "home";
  } else if (selectedCategory === "درآمد") {
    row.dataset.category = "salary";
  }

  closeModal();

  // Reset
  transactionModalTitle.value = "";
  transactionModalAmount.value = "";
  categoryOptions.forEach((item) => {
    item.classList.remove("active");
  });
  selectedCategory = "";
  saveBtn.addEventListener("click", createNewTransaction);

  filterTransactions();
}

// Events
searchInput.addEventListener("input", filterTransactions);
monthFilter.addEventListener("change", filterTransactions);
categoryFilter.addEventListener("change", filterTransactions);
tagFilter.addEventListener("change", filterTransactions);
paymentFilter.addEventListener("change", filterTransactions);
sortFilter.addEventListener("change", filterTransactions);
// filterBtn.addEventListener("click", filterTransactions);
addTransactionBtn.addEventListener("click", () => {
  saveBtn.addEventListener("click", createNewTransaction);
  openModal();
});

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
recurringTransaction.addEventListener("change", () => {
  if (recurringTransaction.checked) {
    recurringFields.classList.remove("hidden");
  } else {
    recurringFields.classList.add("hidden");
  }
});
// Initial render
filterTransactions();

//receipt part
const ctx = receiptCanvas.getContext("2d");
let receiptImage = null;
let croppedReceipt = null;

receiptInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // show Progress Bar
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

//draw Receipt on canvas
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
  //clear prev img
  ctx.clearRect(0, 0, receiptCanvas.width, receiptCanvas.height);
  //draw new img
  ctx.drawImage(img, 0, 0, width, height);
}

cropReceiptBtn.addEventListener("click", () => {
  if (!receiptImage) return;
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
  ctx.drawImage(croppedCanvas, 0, 0);
  croppedReceipt = croppedCanvas.toDataURL("image/jpeg", 0.9);
});

removeReceiptBtn.addEventListener("click", () => {
  receiptInput.value = "";
  receiptImage = null;
  croppedReceipt = null;
  ctx.clearRect(0, 0, receiptCanvas.width, receiptCanvas.height);
  receiptPreview.classList.add("hidden");
});

modalOverlay.addEventListener("click", closeModal);
