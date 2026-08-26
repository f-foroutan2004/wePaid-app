const profileForm = document.getElementById("profileForm");
const usernameInput = document.getElementById("username");
const currencySelect = document.getElementById("currency");
const headerUsername = document.getElementById("headerUsername");
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
const nameError = document.querySelector(".nameError");
const nameModalError = document.querySelector(".nameModalError");
const emailModalError = document.querySelector(".emailModalError");
const usernameElement = document.querySelector("#headerUsername");

const username = localStorage.getItem("userName");

if (username) {
  usernameElement.textContent = username;
} else {
  usernameElement.textContent = "کاربر";
}

let wallets = JSON.parse(localStorage.getItem("wallets")) || [];
let invitations = JSON.parse(localStorage.getItem("invitations")) || [];
let profile = JSON.parse(localStorage.getItem("profile")) || {
  username: "",
  currency: "IRR",
};

let editingWalletId = null;

let selectedWalletId = null;

// Currency Names
const currencyNames = {
  IRR: "تومان",
  USD: "دلار",
  EUR: "یورو",
  GBP: "پوند",
  AED: "درهم",
};

// Load Profile
function loadProfile() {
  usernameInput.value = profile.username || "";
  currencySelect.value = profile.currency || "IRR";
  headerUsername.textContent = profile.username || "";
}

// Save Profile
profileForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const currency = currencySelect.value;

  if (username === "") {
    nameError.classList.remove("hidden");
    return;
  }
  nameError.classList.add("hidden");
  profile = {
    username: username,
    currency: currency,
  };

  localStorage.setItem("profile", JSON.stringify(profile));
  headerUsername.textContent = username;
  alert("تغییرات با موفقیت ذخیره شد.");
});

// Save Wallets
function saveWallets() {
  localStorage.setItem("wallets", JSON.stringify(wallets));
}

// Save Invitations
function saveInvitations() {
  localStorage.setItem("invitations", JSON.stringify(invitations));
}

// Open Wallet Modal
addWalletBtn.addEventListener("click", function () {
  editingWalletId = null;
  walletForm.reset();
  walletModalTitle.textContent = "ساخت کیف پول";
  nameModalError.classList.add("hidden");
  walletModal.classList.remove("hidden");
});

// Close Wallet Modal
function closeWalletModalFunc() {
  walletModal.classList.add("hidden");
  walletForm.reset();
  editingWalletId = null;
  nameModalError.classList.add("hidden");
}

closeWalletModal.addEventListener("click", closeWalletModalFunc);
cancelWallet.addEventListener("click", closeWalletModalFunc);

// Wallet Form
walletForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = walletName.value.trim();
  const currency = walletCurrency.value;

  if (name === "") {
    nameModalError.classList.remove("hidden");
    return;
  }
  nameModalError.classList.add("hidden");

  // Edit Wallet
  if (editingWalletId !== null) {
    const wallet = wallets.find(function (wallet) {
      return wallet.id === editingWalletId;
    });

    if (wallet) {
      wallet.name = name;
      wallet.currency = currency;
    }
  }

  // Create Wallet
  else {
    const newWallet = {
      id: Date.now(),
      name: name,
      currency: currency,
      balance: 0,
      members: 1,
    };

    wallets.push(newWallet);
  }

  saveWallets();
  renderWallets();
  closeWalletModalFunc();
});

// Render Wallets
function renderWallets() {
  walletList.innerHTML = "";
  if (wallets.length === 0) {
    walletList.innerHTML = `
      <div class="empty-state">
        هنوز کیف پولی ایجاد نکرده‌اید.
      </div>`;
    return;
  }

  wallets.forEach(function (wallet) {
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
                ${currencyNames[wallet.currency]}
              </span>
            </div>
          </div>

          <div class="wallet-actions">
            <button
              class="edit-wallet"
              data-id="${wallet.id}"
              type="button">
              <i class="fas fa-pen"></i>
            </button>

            <button
              class="delete-wallet"
              data-id="${wallet.id}"
              type="button">
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
            ${currencyNames[wallet.currency]}
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
            type="button">
            <i class="fas fa-user-plus"></i>
            دعوت عضو
          </button>
        </div>`;

    walletList.appendChild(card);
  });

  setupWalletButtons();
}

// Wallet Buttons
function setupWalletButtons() {
  // Edit
  document.querySelectorAll(".edit-wallet").forEach(function (button) {
    button.addEventListener("click", function () {
      const id = Number(button.dataset.id);
      const wallet = wallets.find(function (wallet) {
        return wallet.id === id;
      });

      if (!wallet) {
        return;
      }
      editingWalletId = id;
      walletName.value = wallet.name;
      walletCurrency.value = wallet.currency;
      walletModalTitle.textContent = "ویرایش کیف پول";
      walletModal.classList.remove("hidden");
    });
  });

  // Delete
  document.querySelectorAll(".delete-wallet").forEach(function (button) {
    button.addEventListener("click", function () {
      const id = Number(button.dataset.id);
      const confirmed = confirm("آیا از حذف این کیف پول مطمئن هستید؟");
      if (!confirmed) {
        return;
      }
      wallets = wallets.filter(function (wallet) {
        return wallet.id !== id;
      });
      saveWallets();
      renderWallets();
    });
  });

  // Invite From Wallet
  document.querySelectorAll(".invite-member").forEach(function (button) {
    button.addEventListener("click", function () {
      selectedWalletId = Number(button.dataset.id);
      openInviteModalFunc();
    });
  });
}

// Main Invite Button

addInviteBtn.addEventListener("click", function () {
  if (wallets.length === 0) {
    alert("ابتدا یک کیف پول ایجاد کنید.");
    return;
  }

  selectedWalletId = wallets[0].id;
  openInviteModalFunc();
});

// Open Invite Modal
function openInviteModalFunc() {
  inviteForm.reset();
  emailModalError.classList.add("hidden");
  inviteModal.classList.remove("hidden");
}

// Close Invite Modal
function closeInviteModalFunc() {
  inviteModal.classList.add("hidden");
  inviteForm.reset();
  emailModalError.classList.add("hidden");
  selectedWalletId = null;
}

closeInviteModal.addEventListener("click", closeInviteModalFunc);
cancelInvite.addEventListener("click", closeInviteModalFunc);

// Invite Form Submit
inviteForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const user = inviteEmail.value.trim();
  // Validate

  if (user === "") {
    emailModalError.classList.remove("hidden");
    return;
  }
  emailModalError.classList.add("hidden");

  const wallet = wallets.find(function (wallet) {
    return wallet.id === selectedWalletId;
  });

  if (!wallet) {
    alert("کیف پول موردنظر پیدا نشد.");
    return;
  }

  // Create Invitation
  const invitation = {
    id: Date.now(),
    walletId: wallet.id,
    walletName: wallet.name,
    sender: profile.username || "کاربر",
    receiver: user,
    status: "pending",
  };

  // Add Invitation
  invitations.push(invitation);
  saveInvitations();
  renderInvitations();
  closeInviteModalFunc();
  alert("دعوت‌نامه با موفقیت ارسال شد.");
});

// Render Invitations
function renderInvitations() {
  invitationList.innerHTML = "";
  if (invitations.length === 0) {
    invitationList.innerHTML = `
      <div class="empty-state">
        دعوت‌نامه‌ای وجود ندارد.
      </div>`;
    return;
  }

  invitations.forEach(function (invitation) {
    const item = document.createElement("div");
    item.className = "invitation";
    let statusHTML = "";

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
          </div>`;
    } else {
      statusHTML = `
          <span
            class="status ${invitation.status}">
            ${getStatusText(invitation.status)}
          </span>`;
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
        ${statusHTML}`;
    invitationList.appendChild(item);
  });

  setupInvitationButtons();
}

// Invitation Buttons
function setupInvitationButtons() {
  // Accept
  document.querySelectorAll(".accept-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      const id = Number(button.dataset.id);
      const invitation = invitations.find(function (item) {
        return item.id === id;
      });

      if (!invitation) {
        return;
      }
      invitation.status = "accepted";
      saveInvitations();
      renderInvitations();
    });
  });

  // Reject
  document.querySelectorAll(".reject-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      const id = Number(button.dataset.id);
      const invitation = invitations.find(function (item) {
        return item.id === id;
      });
      if (!invitation) {
        return;
      }
      invitation.status = "rejected";
      saveInvitations();
      renderInvitations();
    });
  });
}

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

// Initial Load
loadProfile();
renderWallets();
renderInvitations();
