import api from "./api.js";

// =========================
// Elements
// =========================

const walletSelectorWrapper = document.querySelector(
  ".wallet-selector-wrapper",
);

const walletSelectorBtn = document.getElementById("walletSelectorBtn");

const walletSelectorDropdown = document.getElementById(
  "walletSelectorDropdown",
);

const walletListHeader = document.getElementById("walletListHeader");

const selectedWalletName = document.getElementById("selectedWalletName");

// =========================
// Variables
// =========================

let wallets = [];

// =========================
// Get Wallets
// =========================

async function getWallets() {
  try {
    walletListHeader.innerHTML = `
      <div class="wallet-list-loading">
        در حال دریافت کیف پول‌ها...
      </div>
    `;

    const response = await api.get("/wallets");

    wallets = response.data?.data?.wallets || [];

    if (!wallets.length) {
      localStorage.removeItem("walletId");

      selectedWalletName.textContent = "کیف پولی ندارید";

      walletListHeader.innerHTML = `
        <div class="wallet-list-empty">
          هنوز کیف پولی ایجاد نکرده‌اید
        </div>
      `;

      return;
    }

    renderWallets();
    setActiveWallet();
  } catch (error) {
    console.error("Error getting wallets:", error);

    walletListHeader.innerHTML = `
      <div class="wallet-list-empty">
        دریافت کیف پول‌ها با خطا مواجه شد
      </div>
    `;
  }
}

// =========================
// Render Wallets
// =========================

function renderWallets() {
  walletListHeader.innerHTML = "";

  const currentWalletId = localStorage.getItem("walletId");

  wallets.forEach((wallet) => {
    const walletId = wallet.id || wallet.wallet_id;

    const walletName = wallet.name || wallet.wallet_name || "کیف پول";

    const currency =
      wallet.currency?.name ||
      wallet.currency?.symbol ||
      wallet.currency?.code ||
      wallet.currency_name ||
      wallet.currency_symbol ||
      "";

    const isActive = String(walletId) === String(currentWalletId);

    const walletItem = document.createElement("button");

    walletItem.type = "button";

    walletItem.className = `wallet-item select-wallet-list ${isActive ? "active" : ""}`;

    walletItem.innerHTML = `
      <div class="wallet-item-icon">
        <i class="fas fa-wallet"></i>
      </div>

      <div class="wallet-item-info">
        <span class="wallet-item-name">
          ${walletName}
        </span>

        ${
          currency
            ? `<span class="wallet-item-currency">${currency}</span>`
            : ""
        }
      </div>

      ${isActive ? `<i class="fas fa-check wallet-item-check"></i>` : ""}
    `;

    walletItem.addEventListener("click", () => {
      selectWallet(wallet);
    });

    walletListHeader.appendChild(walletItem);
  });
}

// =========================
// Set Active Wallet
// =========================

function setActiveWallet() {
  let walletId = localStorage.getItem("walletId");

  let activeWallet = wallets.find(
    (wallet) => String(wallet.id || wallet.wallet_id) === String(walletId),
  );

  // اگر walletId وجود نداشت یا دیگر معتبر نبود
  if (!activeWallet) {
    activeWallet = wallets[0];

    walletId = activeWallet.id || activeWallet.wallet_id;

    localStorage.setItem("walletId", walletId);
  }

  updateSelectedWallet(activeWallet);
}

// =========================
// Select Wallet
// =========================

function selectWallet(wallet) {
  const walletId = wallet.id || wallet.wallet_id;

  const currentWalletId = localStorage.getItem("walletId");

  // اگر همان کیف پول فعلی انتخاب شد
  if (String(walletId) === String(currentWalletId)) {
    closeWalletDropdown();
    return;
  }

  localStorage.setItem("walletId", walletId);

  updateSelectedWallet(wallet);

  closeWalletDropdown();

  // صفحه را دوباره بارگذاری می‌کنیم
  // تا اطلاعات کیف پول جدید دریافت شود
  window.location.reload();
}

// =========================
// Update Selected Wallet
// =========================

function updateSelectedWallet(wallet) {
  if (!wallet) return;

  const walletName = wallet.name || wallet.wallet_name || "کیف پول";

  selectedWalletName.textContent = walletName;

  renderWallets();
}

// =========================
// Open / Close Dropdown
// =========================

function openWalletDropdown() {
  walletSelectorDropdown.classList.remove("hidden");

  walletSelectorWrapper.classList.add("active");
}

function closeWalletDropdown() {
  walletSelectorDropdown.classList.add("hidden");

  walletSelectorWrapper.classList.remove("active");
}

// =========================
// Toggle Dropdown
// =========================

walletSelectorBtn?.addEventListener("click", (event) => {
  event.stopPropagation();

  const isHidden = walletSelectorDropdown.classList.contains("hidden");

  if (isHidden) {
    openWalletDropdown();
  } else {
    closeWalletDropdown();
  }
});

// =========================
// Close When Click Outside
// =========================

document.addEventListener("click", (event) => {
  if (walletSelectorWrapper && !walletSelectorWrapper.contains(event.target)) {
    closeWalletDropdown();
  }
});

// =========================
// Initial Load
// =========================

if (walletSelectorBtn && walletSelectorDropdown && walletListHeader) {
  getWallets();
}
