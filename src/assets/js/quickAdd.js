const quickAddBtn = document.getElementById("mobileQuickAdd");
const quickAddModal = document.getElementById("quickAddModal");
const closeQuickAdd = document.getElementById("closeQuickAdd");
const quickAddOverlay = document.getElementById("quickAddOverlay");

function openQuickAdd() {
  quickAddModal.classList.remove("hidden");
}

function closeQuickAddModal() {
  quickAddModal.classList.add("hidden");
}

quickAddBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  openQuickAdd();
});

closeQuickAdd?.addEventListener("click", closeQuickAddModal);

quickAddOverlay?.addEventListener("click", closeQuickAddModal);

document.querySelectorAll(".quick-add-item").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    closeQuickAddModal();

    if (action === "income") {
      console.log("افزودن درآمد");
    }

    if (action === "expense") {
      console.log("افزودن هزینه");
    }

    if (action === "budget") {
      console.log("افزودن بودجه");
    }

    if (action === "category") {
      console.log("افزودن دسته‌بندی");
    }
  });
});
