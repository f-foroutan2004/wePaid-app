import api from "./api.js";
import { showToast } from "../../utils/Toast.js";
import "../../utils/logOut.js";
import "./walletSelector.js";

// Elements
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
const modalBox = document.querySelector(".modal-box");
const modalInviteBox = document.querySelector(".modal-invite-box");
const modalOverlay = document.querySelector("#walletModal .modal-overlay");
const inviteModalOverlay = document.querySelector(
  "#inviteModal .inviteModal-overlay",
);
const membersModal = document.getElementById("membersModal");
const membersModalTitle = document.getElementById("membersModalTitle");
const closeMembersModal = document.getElementById("closeMembersModal");
const membersModalOverlay = document.querySelector(
  "#membersModal .members-modal-overlay",
);
const membersList = document.getElementById("membersList");
const membersLoading = document.getElementById("membersLoading");
const usernameElement = document.querySelector("#headerUsername");
const saveWalletButton = document.querySelector("#walletForm .save-btn");
const sendInviteButton = document.querySelector("#inviteForm .save-btn");

let isSavingWallet = false;
let isSendingInvite = false;

// Username
const username = localStorage.getItem("userName");

if (usernameElement) {
  usernameElement.textContent = username || "کاربر";
}

// Skeleton Loading
function showWalletSkeleton() {
  if (!walletList) return;
  walletList.innerHTML = `
    <div class="wallet-skeleton skeleton"></div>
    <div class="wallet-skeleton skeleton"></div>
  `;
}

function disableSaveWalletButton() {
  if (!saveWalletButton) return;

  saveWalletButton.disabled = true;
  saveWalletButton.textContent = "در حال ذخیره...";
}

function enableSaveWalletButton() {
  if (!saveWalletButton) return;

  saveWalletButton.disabled = false;
  saveWalletButton.textContent = "ذخیره";
}

function disableSendInviteButton() {
  if (!sendInviteButton) return;

  sendInviteButton.disabled = true;
  sendInviteButton.textContent = "در حال ارسال...";
}

function enableSendInviteButton() {
  if (!sendInviteButton) return;

  sendInviteButton.disabled = false;
  sendInviteButton.textContent = "ارسال دعوت";
}

function showInvitationSkeleton() {
  if (!invitationList) return;

  invitationList.innerHTML = `
    <div class="invitation-skeleton skeleton"></div>
    <div class="invitation-skeleton skeleton"></div>
    <div class="invitation-skeleton skeleton"></div>
  `;
}

// State
let wallets = [];
let invitations = [];
let editingWalletId = null;
let selectedWalletId = null;
let selectedMembersWalletId = null;

// Wallet ID
function getWalletId(wallet) {
  return wallet.id;
}

// Load Wallet Members
async function loadWalletMembers(walletId) {
  if (!membersList) return;

  try {
    membersList.innerHTML = "";
    membersLoading?.classList.remove("hidden");
    const response = await api.post("/wallet/members", {
      wallet_id: +walletId,
    });

    const responseData = response.data?.data;
    let members = [];

    if (Array.isArray(responseData?.members)) {
      members = responseData.members;
    }

    membersLoading?.classList.add("hidden");

    renderWalletMembers(members);
  } catch (error) {
    membersLoading?.classList.add("hidden");

    membersList.innerHTML = `
      <div class="empty-state">
        خطا در دریافت اعضای کیف پول
      </div>
    `;

    showToast(
      error.response?.data?.data?.message || "خطا در دریافت اعضای کیف پول",
    );
  }
}

// Render Wallet Members
function renderWalletMembers(members) {
  if (!membersList) return;
  membersList.innerHTML = "";

  if (!Array.isArray(members) || members.length === 0) {
    membersList.innerHTML = `
      <div class="empty-state">
        عضوی برای این کیف پول وجود ندارد.
      </div>
    `;

    return;
  }

  members.forEach((member) => {
    console.log(member);
    const memberId = member.user_id;
    const memberName = member.name || "کاربر";
    const memberEmail = member.email || "";

    const memberRole = member.role || "";

    const item = document.createElement("div");
    item.className = "wallet-member-item";
    item.innerHTML = `
      <div class="wallet-member-info">
        <div class="wallet-member-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="wallet-member-details">
          <h4>
            ${memberName}
          </h4>

          ${
            memberEmail
              ? `
                <span>
                  ${memberEmail}
                </span>
              `
              : ""
          }

          ${
            memberRole
              ? `
                <small>
                  ${memberRole}
                </small>
              `
              : ""
          }
        </div>
      </div>
      <button
        class="remove-member-btn"
        type="button"
        data-wallet-id="${selectedMembersWalletId}"
        data-user-id="${memberId}"
        title="حذف عضو"
      >
        <i class="fas fa-user-minus"></i>
        حذف
      </button>
    `;

    membersList.appendChild(item);
  });

  setupMemberButtons();
}

// Open Members Modal
async function openMembersModal(walletId) {
  const wallet = wallets.find((item) => +getWalletId(item) === +walletId);

  if (!wallet) {
    showToast("کیف پول پیدا نشد", "error");

    return;
  }

  selectedMembersWalletId = +walletId;

  const walletName = wallet.name || "کیف پول";

  if (membersModalTitle) {
    membersModalTitle.textContent = `اعضای ${walletName}`;
  }

  membersModal?.classList.remove("hidden");

  await loadWalletMembers(walletId);
}

// Close Members Modal
function closeMembersModalFunc() {
  membersModal?.classList.add("hidden");
  selectedMembersWalletId = null;

  if (membersList) {
    membersList.innerHTML = "";
  }

  membersLoading?.classList.add("hidden");
}

// Load Wallets
async function loadWallets() {
  if (!walletList) return;

  showWalletSkeleton();

  try {
    const response = await api.get("/wallets");
    const apiWallets = response.data?.data?.wallets || [];
    wallets = Array.isArray(apiWallets) ? apiWallets : [];

    //members of each wallet
    for (const wallet of wallets) {
      const walletId = getWalletId(wallet);

      if (!walletId) {
        wallet.memberCount = 0;
        continue;
      }

      try {
        const response = await api.post("/wallet/members", {
          wallet_id: +walletId,
        });

        const data = response.data?.data;
        if (Array.isArray(data?.members)) {
          wallet.memberCount = data.members.length;
        }
      } catch (error) {
        console.error(`خطا در دریافت اعضای کیف پول ${walletId}:`, error);
        wallet.memberCount = 0;
      }
    }

    renderWallets();
  } catch (error) {
    wallets = [];

    renderWallets();

    showToast(
      error.response?.data?.data?.message || "خطا در دریافت کیف پول‌ها",
    );
  }
}

// Load Wallet Currencies
async function loadWalletCurrencies() {
  if (!walletCurrency) return;

  try {
    const response = await api.get("/currencies");
    const currencies = response.data?.data?.currencies || [];

    walletCurrency.innerHTML = "";

    if (!Array.isArray(currencies)) return;

    currencies.forEach((currency) => {
      const option = document.createElement("option");

      option.value = currency.ISO;

      option.textContent = currency.name ?? "ارز";

      walletCurrency.appendChild(option);
    });
  } catch (error) {
    walletCurrency.innerHTML = `
      <option value="">
        خطا در دریافت ارزها
      </option>
    `;
  }
}

// Open Wallet Modal
function openWalletModal() {
  editingWalletId = null;
  walletForm?.reset();

  if (walletModalTitle) {
    walletModalTitle.textContent = "ساخت کیف پول";
  }

  nameModalError?.classList.add("hidden");
  walletModal?.classList.remove("hidden");
  modalBox?.classList.add("animate");
}

// Close Wallet Modal
function closeWalletModalFunc() {
  walletModal?.classList.add("hidden");
  walletForm?.reset();
  editingWalletId = null;
  nameModalError?.classList.add("hidden");
  modalBox?.classList.remove("animate");
}

// Handle Wallet Submit
async function handleWalletSubmit(event) {
  event.preventDefault();

  // جلوگیری از ارسال چندباره
  if (isSavingWallet) return;

  const name = walletName?.value.trim();
  const currency = walletCurrency?.value;

  if (!name) {
    nameModalError?.classList.remove("hidden");
    return;
  }

  nameModalError?.classList.add("hidden");

  isSavingWallet = true;
  disableSaveWalletButton();

  try {
    // Edit
    if (editingWalletId !== null) {
      await updateWallet(editingWalletId, name);
      return;
    }

    // Create
    await createWallet(name, currency);
  } finally {
    isSavingWallet = false;
    enableSaveWalletButton();
  }
}

// Create Wallet
async function createWallet(name, currency) {
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("currency", currency);
    const response = await api.post("/wallet/create", formData);

    if (response.data?.success) {
      const createdWallet = response.data?.data;
      const walletId = createdWallet.wallet_id;

      if (walletId) {
        localStorage.setItem("walletId", walletId);
      }

      showToast("ساخت کیف پول با موفقیت انجام شد", "success");
      closeWalletModalFunc();
      await loadWallets();
      return;
    }

    showToast(response.data?.message || "ساخت کیف پول انجام نشد");
  } catch (error) {
    showToast(
      error.response?.data?.data?.message || "خطایی در ساخت کیف پول رخ داد",
    );
  }
}

// Render Wallets
function renderWallets() {
  if (!walletList) return;

  walletList.innerHTML = "";

  if (!Array.isArray(wallets) || wallets.length === 0) {
    walletList.innerHTML = `
      <div class="empty-state">
        هنوز کیف پولی ایجاد نکرده‌اید.
      </div>
    `;

    return;
  }

  wallets.forEach((wallet) => {
    const walletId = getWalletId(wallet);

    const currencyName = wallet.currency?.name ?? "";
    const balance = +(wallet.balance ?? 0).toLocaleString("en-US");
    const memberCount = +(wallet.memberCount ?? 0);
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
              ${wallet.name || "کیف پول"}
            </h3>

            <span>
              ${currencyName}
            </span>
          </div>
        </div>
        <div class="wallet-actions">
          <button
            class="edit-wallet"
            data-id="${walletId}"
            type="button"
            title="ویرایش"
          >
            <i class="fas fa-pen"></i>
          </button>
          <button
            class="delete-wallet"
            data-id="${walletId}"
            type="button"
            title="حذف"
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
          ${balance}
          ${currencyName}
        </strong>
      </div>
      <div class="wallet-footer">
        <button
          class="wallet-members members-btn"
          data-id="${walletId}"
          type="button"
        >
          <i class="fas fa-users"></i>
          ${memberCount} عضو
        </button>
        <button
          class="invite-member"
          data-id="${walletId}"
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
      if (!confirm("آیا از حذف این کیف پول مطمئن هستید؟")) {
        return;
      }
      await deleteWallet(id);
    });
  });

  // Edit
  document.querySelectorAll(".edit-wallet").forEach((button) => {
    button.addEventListener("click", () => {
      const id = +button.dataset.id;

      const wallet = wallets.find((item) => +getWalletId(item) === id);
      if (!wallet) return;
      editingWalletId = id;
      walletName.value = wallet.name || "";
      console.log(wallet.currency);
      const currency = wallet.currency || "";
      walletCurrency.value = currency;
      walletModalTitle.textContent = "ویرایش کیف پول";

      nameModalError?.classList.add("hidden");
      walletModal?.classList.remove("hidden");
      modalBox?.classList.add("animate");
    });
  });

  // Invite
  document.querySelectorAll(".invite-member").forEach((button) => {
    button.addEventListener("click", () => {
      selectedWalletId = +button.dataset.id;

      openInviteModal();
    });
  });

  // Members
  document.querySelectorAll(".members-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const walletId = +button.dataset.id;

      if (!walletId) {
        showToast("کیف پول معتبر نیست", "error");

        return;
      }

      openMembersModal(walletId);
    });
  });
}

// Remove Member
async function removeMember(walletId, userId) {
  try {
    const response = await api.delete("/wallet/member/remove", {
      data: {
        wallet_id: +walletId,
        user_id: +userId,
      },
    });

    if (response.data?.success) {
      showToast("عضو با موفقیت حذف شد", "success");

      await loadWalletMembers(walletId);
      await loadWallets();
      return;
    }

    showToast(response.data?.data?.message || "حذف عضو انجام نشد", "error");
  } catch (error) {
    showToast(error.response?.data?.data?.message || "خطا در حذف عضو", "error");
  }
}

// Member Buttons
function setupMemberButtons() {
  document.querySelectorAll(".remove-member-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const walletId = +button.dataset.walletId;
      const userId = +button.dataset.userId;

      if (!walletId || !userId) {
        showToast("اطلاعات عضو کامل نیست", "error");

        return;
      }

      if (!confirm("آیا از حذف این عضو مطمئن هستید؟")) {
        return;
      }

      await removeMember(walletId, userId);
    });
  });
}

// Delete Wallet
async function deleteWallet(walletId) {
  try {
    const response = await api.delete(`/wallet/delete/${walletId}`);

    if (response.data?.success) {
      showToast("کیف پول با موفقیت حذف شد", "success");

      if (+localStorage.getItem("walletId") === +walletId) {
        localStorage.removeItem("walletId");
      }

      await loadWallets();
      return;
    }

    showToast(response.data?.message || "حذف کیف پول انجام نشد", "error");
  } catch (error) {
    showToast(
      error.response?.data?.data?.message || "خطایی در حذف کیف پول رخ داد",
    );
  }
}

// Update Wallet
async function updateWallet(walletId, name) {
  try {
    await loadWalletCurrencies();
    const response = await api.put(`/wallet/update/${walletId}`, {
      name: name,
    });

    if (response.data?.success) {
      showToast("کیف پول با موفقیت ویرایش شد", "success");
      closeWalletModalFunc();
      await loadWallets();
      return;
    }

    showToast(response.data?.message || "ویرایش کیف پول انجام نشد", "error");
  } catch (error) {
    showToast(error.response?.data?.data?.message || "خطا در ویرایش کیف پول");
  }
}

// Invite Modal
function handleAddInvite() {
  if (wallets.length === 0) {
    showToast("ابتدا یک کیف پول ایجاد کنید.", "error");
    return;
  }

  selectedWalletId = getWalletId(wallets[0]);
  openInviteModal();
}

function openInviteModal() {
  inviteForm?.reset();
  emailModalError?.classList.add("hidden");
  inviteModal?.classList.remove("hidden");
  modalInviteBox?.classList.add("animate");
}

function closeInviteModalFunc() {
  inviteModal?.classList.add("hidden");
  inviteForm?.reset();
  emailModalError?.classList.add("hidden");
  selectedWalletId = null;
  modalInviteBox?.classList.remove("animate");
}

// Invite Submit
async function handleInviteSubmit(event) {
  event.preventDefault();

  // جلوگیری از ارسال چندباره
  if (isSendingInvite) return;

  const user = inviteEmail?.value.trim();

  if (!user) {
    emailModalError?.classList.remove("hidden");
    return;
  }

  emailModalError?.classList.add("hidden");

  if (!selectedWalletId) {
    showToast("کیف پول انتخاب نشده است", "error");
    return;
  }

  isSendingInvite = true;
  disableSendInviteButton();

  try {
    const response = await api.post("/invitation/create", {
      wallet_id: Number(selectedWalletId),
      email: user,
    });

    if (response.data?.success) {
      showToast("دعوت‌نامه با موفقیت ارسال شد", "success");
      closeInviteModalFunc();
      await loadInvitations();
      await loadWallets();
      return;
    }

    showToast(
      response.data?.data?.message || "ارسال دعوت‌نامه انجام نشد",
      "error",
    );
  } catch (error) {
    showToast(
      error.response?.data?.data?.message || "خطا در ارسال دعوت‌نامه",
      "error",
    );
  } finally {
    isSendingInvite = false;
    enableSendInviteButton();
  }
}

// Load Invitations
async function loadInvitations() {
  if (!invitationList) return;

  showInvitationSkeleton();

  try {
    const response = await api.get("/invitations");
    const receivedInvitations = response.data?.data?.received || [];
    const sentInvitations = response.data?.data?.sent || [];

    invitations = [
      ...(Array.isArray(receivedInvitations)
        ? receivedInvitations.map((invitation) => ({
            ...invitation,
            invitationType: "received",
          }))
        : []),

      ...(Array.isArray(sentInvitations)
        ? sentInvitations.map((invitation) => ({
            ...invitation,
            invitationType: "sent",
          }))
        : []),
    ];

    renderInvitations();
  } catch (error) {
    console.error("Load invitations error:", error);
    invitations = [];
    renderInvitations();
  }
}

// Render Invitations
function renderInvitations() {
  if (!invitationList) return;

  invitationList.innerHTML = "";

  if (!Array.isArray(invitations) || invitations.length === 0) {
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

    const invitationId = invitation.id;
    const status = invitation.status || "pending";
    const walletName = invitation.wallet?.name || "کیف پول";

    // Received Invitation
    if (invitation.invitationType === "received") {
      const sender = invitation.inviter.name || "کاربر";
      let actionHTML = "";

      if (status === "pending") {
        actionHTML = `
            <div class="invitation-actions">
              <button
                class="accept-btn"
                data-id="${invitationId}"
                type="button"
              >
                قبول
              </button>
              <button
                class="reject-btn"
                data-id="${invitationId}"
                type="button"
              >
                رد
              </button>

            </div>
          `;
      } else {
        actionHTML = `
            <span
              class="status ${status}"
            >
              ${getStatusText(status)}
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
                ${walletName}
              </h4>
              <p>
                ارسال شده توسط
                ${sender}
              </p>
            </div>
          </div>
          ${actionHTML}
        `;
    }

    // Sent Invitation
    else {
      const inviteeName = invitation.invitee?.name || "کاربر";

      const inviteeEmail = invitation.invitee?.email || "";

      item.innerHTML = `
          <div class="invitation-info">
            <div class="invitation-icon">
              <i class="fas fa-paper-plane"></i>
            </div>
            <div>
              <h4>
                دعوت به
                ${walletName}
              </h4>
              <p>
                ارسال شده برای
                ${inviteeName}
              </p>
              ${
                inviteeEmail
                  ? `
                    <small>
                      ${inviteeEmail}
                    </small>
                  `
                  : ""
              }
            </div>
          </div>
          <span
            class="status ${status}"
          >
            ${getStatusText(status)}
          </span>
        `;
    }

    invitationList.appendChild(item);
  });

  setupInvitationButtons();
}

// Invitation Buttons
function setupInvitationButtons() {
  document.querySelectorAll(".accept-btn").forEach((button) => {
    button.addEventListener("click", () =>
      respondInvitation(button.dataset.id, true),
    );
  });

  document.querySelectorAll(".reject-btn").forEach((button) => {
    button.addEventListener("click", () =>
      respondInvitation(button.dataset.id, false),
    );
  });
}

// Respond Invitation
async function respondInvitation(invitationId, accepted) {
  try {
    const response = await api.put("/invitation/respond", {
      invitation_id: Number(invitationId),
      status: accepted ? "accepted" : "rejected",
    });

    if (response.data?.success) {
      showToast(
        accepted ? "دعوت‌نامه پذیرفته شد" : "دعوت‌نامه رد شد",
        "success",
      );

      await loadInvitations();

      if (accepted) {
        await loadWallets();
      }

      return;
    }

    showToast(response.data?.data?.message || "پاسخ به دعوت‌نامه انجام نشد");
  } catch (error) {
    showToast(
      error.response?.data?.data?.message || "خطا در پاسخ به دعوت‌نامه",
    );
  }
}

// Status Text
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

  return status;
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

if (closeMembersModal) {
  closeMembersModal.addEventListener("click", closeMembersModalFunc);
}

if (membersModalOverlay) {
  membersModalOverlay.addEventListener("click", closeMembersModalFunc);
}

// Initial Load
async function initWallet() {
  await Promise.all([loadWalletCurrencies(), loadWallets(), loadInvitations()]);
}

initWallet();
