const quickAddBtn = document.getElementById("quickAddBtn");
const transactionModal = document.querySelector(".transaction-modal");
const closeModalBtn = document.querySelector(".close-modal");
const closeModalBtn2 = document.querySelector("#closeModal");

function openModal(){
transactionModal.classList.remove("hidden");
}
function closeModal(){
transactionModal.classList.add("hidden");
}
quickAddBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
closeModalBtn2.addEventListener("click", closeModal);

