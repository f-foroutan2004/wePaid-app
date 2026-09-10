import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

// DOM Elements
const walletList = document.getElementById("walletList");
const addWalletBtn = document.getElementById("addWalletBtn");
const addInviteBtn = document.getElementById("addInviteBtn");
const walletModal = document.getElementById("walletModal");
const walletModalTitle = document.getElementById("walletModalTitle");
const walletForm = document.getElementById("walletForm");
const walletName = document.getElementById("walletName");
const walletCurrency = document.getElementById("walletCurrency");
const closeWalletModal = document.getElementById("closeWalletModal");
const cancelWallet = document.getElementById("cancelWallet");
const inviteModal = document.getElementById("inviteModal");
const inviteForm = document.getElementById("inviteForm");
const inviteEmail = document.getElementById("inviteEmail");
const closeInviteModal = document.getElementById("closeInviteModal");
const cancelInvite = document.getElementById("cancelInvite");
const invitationList = document.getElementById("invitationList");
const nameModalError = document.querySelector(".nameModalError");
const emailModalError = document.querySelector(".emailModalError");
const modalOverlay = document.querySelector(".modal-overlay");
const inviteModalOverlay = document.querySelector(".inviteModal-overlay");
const modalBox = document.querySelector(".modal-box");
const modalInviteBox = document.querySelector(".modal-invite-box");

// State
let wallets = JSON.parse(localStorage.getItem("wallets")) || [];
let invitations = JSON.parse(localStorage.getItem("invitations")) || [];

let editingWalletId = null;
let selectedWalletId = null;

// Save Wallets
function saveWallets() {
  localStorage.setItem("wallets", JSON.stringify(wallets));
}

// Save Invitations
function saveInvitations() {
  localStorage.setItem("invitations", JSON.stringify(invitations));
}

// Load Wallet Currencies
async function loadWalletCurrencies() {
  if (!walletCurrency) return;

  try {
    const response = await api.get("/currencies");
    const currencies = response.data?.data?.currencies || [];
    walletCurrency.innerHTML = "";

    currencies.forEach((currency) => {
      const option = document.createElement("option");
      option.value = currency.name;
      option.textContent = currency.name;

      walletCurrency.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading wallet currencies:", error);
    walletCurrency.innerHTML = `
      <option value="">خطا در دریافت ارزها</option>
    `;
  }
}

// Open Wallet Modal
function openWalletModal() {
  editingWalletId = null;
  walletForm.reset();
  walletModalTitle.textContent = "ساخت کیف پول";
  nameModalError.classList.add("hidden");
  walletModal.classList.remove("hidden");
  modalBox.classList.add("animate");
}

// Close Wallet Modal
function closeWalletModalFunc() {
  walletModal.classList.add("hidden");
  walletForm.reset();
  editingWalletId = null;
  nameModalError.classList.add("hidden");
}

// Wallet Form Submit
async function handleWalletSubmit(event) {
  event.preventDefault();

  const name = walletName.value.trim();
  const currency = walletCurrency.value;

  // Validation
  if (name === "") {
    nameModalError.classList.remove("hidden");
    return;
  }

  nameModalError.classList.add("hidden");

  // Edit Wallet
  if (editingWalletId !== null) {
    await updateWallet(editingWalletId, name);
  }
  // Create Wallet
  else {
    await createWallet(name, currency);
  }
  saveWallets();
  renderWallets();
  closeWalletModalFunc();
}

async function createWallet(name, currency) {
  const token = localStorage.getItem("token");

  const walletData = new FormData();
  walletData.append("name", name);
  walletData.append("currency", currency);

  try {
    const response = await api.post("/wallet/create", walletData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.success) {
      const createdWallet = response.data?.data;

      wallets.push({
        id: createdWallet.wallet_id,
        name: createdWallet.name || name,
        currency: createdWallet.currency?.name || currency,
        balance: createdWallet.balance || 0,
        members: createdWallet.members || 1,
      });
      console.log(createdWallet.wallet_id);

      showToast("ساخت کیف پول با موفقیت انجام شد", "success");

      return response.data;
    }
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.data?.message;
      showToast(message || "خطایی در ساخت کیف پول رخ داد", "error");
    } else {
      showToast("ارتباط با سرور برقرار نشد", "error");
    }

    return;
  }
}

// Render Wallets
function renderWallets() {
  if (!walletList) return;

  walletList.innerHTML = "";

  // Empty state
  if (wallets.length === 0) {
    walletList.innerHTML = `
      <div class="empty-state">
        هنوز کیف پولی ایجاد نکرده‌اید.
      </div>
    `;
    return;
  }

  // Wallet cards
  wallets.forEach((wallet) => {
    const card = document.createElement("div");
    card.className = "wallet-card";
    card.innerHTML = `
      <div class="wallet-header">
        <div class="wallet-name">
          <div class="wallet-icon">
            <i class="fas fa-wallet"></i>
          </div>

          <div>
            <h3>
              ${wallet.name}
            </h3>

            <span>
              ${wallet.currency}
            </span>
          </div>
        </div>

        <div class="wallet-actions">
          <button
            class="edit-wallet"
            data-id="${wallet.id}"
            type="button"
          >
            <i class="fas fa-pen"></i>
          </button>

          <button
            class="delete-wallet"
            data-id="${wallet.id}"
            type="button"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>

      <div class="wallet-info">
        <span>
          موجودی
        </span>

        <strong>
          ${wallet.balance}
          ${wallet.currency}
        </strong>
      </div>

      <div class="wallet-footer">
        <div class="wallet-members">
          <i class="fas fa-users"></i>
          ${wallet.members} عضو
        </div>

        <button
          class="invite-member"
          data-id="${wallet.id}"
          type="button"
        >
          <i class="fas fa-user-plus"></i>
          دعوت عضو
        </button>
      </div>
    `;
    walletList.appendChild(card);
  });

  setupWalletButtons();
}

// Wallet Buttons
function setupWalletButtons() {
  // Delete
  document.querySelectorAll(".delete-wallet").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = +button.dataset.id;
      const confirmed = confirm("آیا از حذف این کیف پول مطمئن هستید؟");

      console.log("id:", id);
      if (!confirmed) return;

      await deleteWallet(id);
    });
  });
  // Edit
  document.querySelectorAll(".edit-wallet").forEach((button) => {
    button.addEventListener("click", () => {
      const id = +button.dataset.id;
      const wallet = wallets.find((wallet) => wallet.id === id);

      if (!wallet) return;

      editingWalletId = id;
      walletName.value = wallet.name;
      walletCurrency.value = wallet.currency;
      walletModalTitle.textContent = "ویرایش کیف پول";
      walletModal.classList.remove("hidden");
      modalBox.classList.add("animate");
    });
  });

  // Invite From Wallet
  document.querySelectorAll(".invite-member").forEach((button) => {
    button.addEventListener("click", () => {
      selectedWalletId = +button.dataset.id;
      openInviteModal();
    });
  });
}

async function deleteWallet(walletId) {
  const token = localStorage.getItem("token");

  console.log("walletId:", walletId);
  try {
    const response = await api.delete(`/wallet/delete/${walletId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.success) {
      wallets = wallets.filter((wallet) => wallet.id !== walletId);

      saveWallets();
      renderWallets();

      showToast("کیف پول با موفقیت حذف شد", "success");
    }
  } catch (error) {
    console.error("Delete wallet error:", error);

    if (error.response) {
      const message = error.response.data?.data?.message;

      showToast(message || "خطایی در حذف کیف پول رخ داد", "error");
    } else {
      showToast("ارتباط با سرور برقرار نشد", "error");
    }
  }
}

async function updateWallet(walletId, name) {
  const token = localStorage.getItem("token");

  try {
    const response = await api.put(
      `/wallet/update/${walletId}`,
      {
        name: name,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data?.success) {
      showToast("کیف پول با موفقیت ویرایش شد", "success");

      const wallet = wallets.find((wallet) => wallet.id === walletId);

      if (wallet) {
        wallet.name = name;
      }

      saveWallets();
      renderWallets();
      closeWalletModalFunc();
    }
  } catch (error) {
    console.log("STATUS:", error.response?.status);
    console.log("RESPONSE:", error.response?.data);
  }
}

// Main Invite Button
function handleAddInvite() {
  if (wallets.length === 0) {
    alert("ابتدا یک کیف پول ایجاد کنید.");
    return;
  }
  // invite member to first wallet
  selectedWalletId = wallets[0].id;
  openInviteModal();
}

// Open Invite Modal
function openInviteModal() {
  inviteForm.reset();
  emailModalError.classList.add("hidden");
  inviteModal.classList.remove("hidden");
  modalInviteBox.classList.add("animate");
}

// Close Invite Modal
function closeInviteModalFunc() {
  inviteModal.classList.add("hidden");
  inviteForm.reset();
  emailModalError.classList.add("hidden");
  selectedWalletId = null;
}

// Invite Form Submit
function handleInviteSubmit(event) {
  event.preventDefault();
  const user = inviteEmail.value.trim();

  // Validation
  if (user === "") {
    emailModalError.classList.remove("hidden");
    return;
  }
  emailModalError.classList.add("hidden");

  // Find Wallet
  const wallet = wallets.find((wallet) => wallet.id === selectedWalletId);

  if (!wallet) {
    alert("کیف پول موردنظر پیدا نشد.");

    return;
  }

  // Get username
  const username = localStorage.getItem("userName");

  // Create Invitation
  const invitation = {
    id: Date.now(),
    walletId: wallet.id,
    walletName: wallet.name,
    sender: username || "کاربر",
    receiver: user,
    status: "pending",
  };

  // Add invitation
  invitations.push(invitation);
  saveInvitations();
  renderInvitations();
  closeInviteModalFunc();
  alert("دعوت‌نامه با موفقیت ارسال شد.");
}

// Render Invitations
function renderInvitations() {
  if (!invitationList) return;

  invitationList.innerHTML = "";

  // Empty state
  if (invitations.length === 0) {
    invitationList.innerHTML = `
      <div class="empty-state">
        دعوت‌نامه‌ای وجود ندارد.
      </div>
    `;
    return;
  }

  invitations.forEach((invitation) => {
    const item = document.createElement("div");
    item.className = "invitation";
    let statusHTML = "";

    // Pending
    if (invitation.status === "pending") {
      statusHTML = `
        <div class="invitation-actions">
          <button
            class="accept-btn"
            data-id="${invitation.id}"
            type="button">
            قبول
          </button>
          <button
            class="reject-btn"
            data-id="${invitation.id}"
            type="button">
            رد
          </button>

        </div>
      `;
    }

    // Accepted / Rejected
    else {
      statusHTML = `
        <span
          class="status ${invitation.status}"
        >
          ${getStatusText(invitation.status)}
        </span>
      `;
    }

    item.innerHTML = `
      <div class="invitation-info">
        <div class="invitation-icon">
          <i class="fas fa-envelope"></i>
        </div>
        <div>
          <h4>
            دعوت به
            ${invitation.walletName}
          </h4>
          <p>
            ارسال شده توسط
            ${invitation.sender}
          </p>
        </div>
      </div>
      ${statusHTML}
    `;

    invitationList.appendChild(item);
  });
  setupInvitationButtons();
}

// Invitation Buttons
function setupInvitationButtons() {
  // Accept
  document.querySelectorAll(".accept-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = +button.dataset.id;
      const invitation = invitations.find((item) => item.id === id);

      if (!invitation) return;
      invitation.status = "accepted";

      saveInvitations();
      renderInvitations();
    });
  });

  // Reject
  document.querySelectorAll(".reject-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = +button.dataset.id;
      const invitation = invitations.find((item) => item.id === id);
      if (!invitation) return;
      invitation.status = "rejected";

      saveInvitations();
      renderInvitations();
    });
  });
}

// Invitation Status
function getStatusText(status) {
  if (status === "pending") {
    return "در انتظار";
  }
  if (status === "accepted") {
    return "پذیرفته شده";
  }
  if (status === "rejected") {
    return "رد شده";
  }
  return "";
}

// Event Listeners
if (addWalletBtn) {
  addWalletBtn.addEventListener("click", openWalletModal);
}

if (closeWalletModal) {
  closeWalletModal.addEventListener("click", closeWalletModalFunc);
}

if (cancelWallet) {
  cancelWallet.addEventListener("click", closeWalletModalFunc);
}

if (walletForm) {
  walletForm.addEventListener("submit", handleWalletSubmit);
}

if (addInviteBtn) {
  addInviteBtn.addEventListener("click", handleAddInvite);
}

if (closeInviteModal) {
  closeInviteModal.addEventListener("click", closeInviteModalFunc);
}

if (cancelInvite) {
  cancelInvite.addEventListener("click", closeInviteModalFunc);
}

if (inviteForm) {
  inviteForm.addEventListener("submit", handleInviteSubmit);
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", closeWalletModalFunc);
}

if (inviteModalOverlay) {
  inviteModalOverlay.addEventListener("click", closeInviteModalFunc);
}

// Initial Load
loadWalletCurrencies();
renderWallets();
renderInvitations();
