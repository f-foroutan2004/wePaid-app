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
const existingCards = document.querySelectorAll(".budget-card");

// Username
const username = localStorage.getItem("userName");
usernameElement.textContent = username || "کاربر";

let editingCard = null;

//categories
const categories = {
  food: {
    name: "غذا",
    icon: "fa-utensils",
    className: "food",
  },

  transport: {
    name: "حمل و نقل",
    icon: "fa-car",
    className: "transport",
  },

  shopping: {
    name: "خرید",
    icon: "fa-shopping-bag",
    className: "shopping",
  },

  entertainment: {
    name: "تفریح",
    icon: "fa-gamepad",
    className: "entertainment",
  },
};

//open modal
function openModal() {
  editingCard = null;
  budgetModal.classList.remove("hidden");
  modalContent.classList.add("animate");
}

//close modal
function closeModal() {
  editingCard = null;
  budgetModal.classList.add("hidden");
  modalContent.classList.remove("animate");
}

addBudgetBtn.addEventListener("click", openModal);
closeBudgetModal.addEventListener("click", closeModal);
cancelBudget.addEventListener("click", closeModal);

// Submit modal Form
budgetForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const category = budgetCategory.value;
  const amount = +budgetAmount.value;

  if (!amount || amount <= 0) {
    amountError.classList.remove("hidden");
    return;
  }
  amountError.classList.add("hidden");

  if (editingCard) {
    updateBudget(editingCard, category, amount);
  } else {
    createBudget(category, amount);
  }

  closeModal();
  budgetAmount.value = "";
});

//create new Budget
function createBudget(category, amount) {
  const data = categories[category];
  const card = document.createElement("div");
  card.className = "budget-card";
  card.dataset.category = category;
  card.innerHTML = `
    <div class="budget-card-header">
      <div class="budget-title">
        <div class="budget-icon ${data.className}">
          <i class="fas ${data.icon}"></i>
        </div>

        <div>
          <h3>
            ${data.name}
          </h3>
          <span>
            بودجه ماهانه
          </span>
        </div>
      </div>
      <button
        class="edit-budget"
        type="button">
        <i class="fas fa-pen"></i>
      </button>
    </div>

    <div class="budget-amounts">
      <div>
        <span>مصرف شده</span>
        <strong class="spent">
          0 تومان
        </strong>
      </div>

      <div>
        <span>بودجه کل</span>
        <strong class="total">
          ${amount} تومان
        </strong>
      </div>
    </div>

    <div class="progress-info">
      <span class="percentage">0٪ مصرف شده</span>
      <span class="remaining">
        ${amount} تومان باقی‌مانده
      </span>
    </div>

    <div class="progress-bar">
      <div
        class="progress-fill"
        style="width: 0%"
      ></div>
    </div>
  `;
  budgetList.appendChild(card);
  setupEditButton(card);
}

//setup Edit Button form
function setupEditButton(card) {
  const editButton = card.querySelector(".edit-budget");
  editButton.addEventListener("click", function () {
    editingCard = card;

    const category = card.dataset.category;
    const totalText = card.querySelector(".total").textContent;
    const total = +totalText.replace("تومان", "").replace(/,/g, "");

    // put data in form
    budgetCategory.value = category;
    budgetAmount.value = total;
    modalTitle.textContent = "ویرایش بودجه";
    budgetModal.classList.remove("hidden");
  });
  modalContent.classList.add("animate");
}

//budget edit
function updateBudget(card, category, amount) {
  const data = categories[category];

  // change category
  card.dataset.category = category;

  // change title
  card.querySelector(".budget-title h3").textContent = data.name;

  // change icon
  const iconBox = card.querySelector(".budget-icon");
  iconBox.className = `budget-icon ${data.className}`;
  iconBox.querySelector("i").className = `fas ${data.icon}`;

  // change amount
  card.querySelector(".total").textContent = `${amount} تومان`;

  const spentText = card.querySelector(".spent").textContent;
  const spent = +spentText.replace(" تومان", "").replace(/,/g, "");

  //Progress counting
  updateProgress(card, spent, amount);
}

// Progress
function updateProgress(card, spent, total) {
  let percentage = (spent / total) * 100;

  if (percentage > 100) {
    percentage = 100;
  }
  const remaining = Math.max(total - spent, 0);

  card.querySelector(".percentage").textContent =
    `${Math.round(percentage)}٪ مصرف شده`;

  card.querySelector(".remaining").textContent =
    `${remaining} تومان باقی‌مانده`;

  card.querySelector(".progress-fill").style.width = `${percentage}%`;

  if (percentage >= 80) {
    card.querySelector(".progress-fill").classList.add("warning");
  } else {
    card.querySelector(".progress-fill").classList.remove("warning");
  }
}

existingCards.forEach((card) => {
  setupEditButton(card);
});

modalOverlay.addEventListener("click", closeModal);
