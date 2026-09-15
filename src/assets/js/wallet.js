import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

// ======================================================
// Elements
// ======================================================

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

// Members Modal
const membersModal = document.getElementById("membersModal");
const membersModalTitle = document.getElementById("membersModalTitle");
const closeMembersModal = document.getElementById("closeMembersModal");
const membersModalOverlay = document.querySelector(
  "#membersModal .members-modal-overlay",
);
const membersList = document.getElementById("membersList");
const membersLoading = document.getElementById("membersLoading");

// ======================================================
// State
// ======================================================

let wallets = [];
let invitations = [];

let editingWalletId = null;
let selectedWalletId = null;
let selectedMembersWalletId = null;

// ======================================================
// Wallet ID
// ======================================================

function getWalletId(wallet) {
  return wallet?.wallet_id ?? wallet?.id;
}

// ======================================================
// Load Wallet Members
// ======================================================

async function loadWalletMembers(walletId) {
  if (!membersList) return;

  try {
    membersList.innerHTML = "";
    membersLoading?.classList.remove("hidden");

    const response = await api.post("/wallet/members", {
      wallet_id: Number(walletId),
    });

    console.log("WALLET MEMBERS RESPONSE:", response.data);

    const responseData = response.data?.data;

    let members = [];

    if (Array.isArray(responseData?.members)) {
      members = responseData.members;
    } else if (Array.isArray(responseData)) {
      members = responseData;
    } else if (Array.isArray(response.data?.members)) {
      members = response.data.members;
    }

    membersLoading?.classList.add("hidden");

    renderWalletMembers(members);
  } catch (error) {
    console.error("Load wallet members error:", error);

    membersLoading?.classList.add("hidden");

    membersList.innerHTML = `
      <div class="empty-state">
        خطا در دریافت اعضای کیف پول
      </div>
    `;

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطا در دریافت اعضای کیف پول",
      "error",
    );
  }
}

// ======================================================
// Render Wallet Members
// ======================================================

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
    const memberId = member.member_id ?? member.user_id ?? member.id;

    const memberName =
      member.name ??
      member.username ??
      member.user?.name ??
      member.user?.username ??
      "کاربر";

    const memberEmail = member.email ?? member.user?.email ?? "";

    const memberRole = member.role ?? member.member_role ?? "";

    const item = document.createElement("div");

    item.className = "wallet-member-item";

    item.innerHTML = `
      <div class="wallet-member-info">

        <div class="wallet-member-avatar">
          <i class="fas fa-user"></i>
        </div>

        <div class="wallet-member-details">

          <h4>
            ${escapeHTML(String(memberName))}
          </h4>

          ${
            memberEmail
              ? `
                <span>
                  ${escapeHTML(String(memberEmail))}
                </span>
              `
              : ""
          }

          ${
            memberRole
              ? `
                <small>
                  ${escapeHTML(String(memberRole))}
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

// ======================================================
// Open Members Modal
// ======================================================

async function openMembersModal(walletId) {
  const wallet = wallets.find(
    (item) => Number(getWalletId(item)) === Number(walletId),
  );

  if (!wallet) {
    showToast("کیف پول پیدا نشد", "error");
    return;
  }

  selectedMembersWalletId = Number(walletId);

  const walletName = wallet.name || "کیف پول";

  if (membersModalTitle) {
    membersModalTitle.textContent = `اعضای ${walletName}`;
  }

  membersModal?.classList.remove("hidden");

  await loadWalletMembers(walletId);
}

// ======================================================
// Close Members Modal
// ======================================================

function closeMembersModalFunc() {
  membersModal?.classList.add("hidden");

  selectedMembersWalletId = null;

  if (membersList) {
    membersList.innerHTML = "";
  }

  membersLoading?.classList.add("hidden");
}

// ======================================================
// Load Wallets
// ======================================================

async function loadWallets() {
  if (!walletList) return;

  try {
    walletList.innerHTML = `
      <div class="empty-state">
        در حال دریافت کیف پول‌ها...
      </div>
    `;

    const response = await api.get("/wallets");

    const apiWallets =
      response.data?.data?.wallets || response.data?.wallets || [];

    wallets = Array.isArray(apiWallets) ? apiWallets : [];

    // ==================================================
    // دریافت تعداد اعضای هر کیف پول
    // ==================================================

    await Promise.all(
      wallets.map(async (wallet) => {
        const walletId = getWalletId(wallet);

        if (!walletId) {
          wallet.memberCount = 0;
          return;
        }

        try {
          const membersResponse = await api.post("/wallet/members", {
            wallet_id: Number(walletId),
          });

          console.log(`Members response ${walletId}:`, membersResponse.data);

          const responseData = membersResponse.data?.data;

          let memberCount = 0;

          // حالت اول:
          // data.members = [...]
          if (Array.isArray(responseData?.members)) {
            memberCount = responseData.members.length;
          }

          // حالت دوم:
          // data.count
          else if (typeof responseData?.count === "number") {
            memberCount = responseData.count;
          }

          // حالت سوم:
          // data.members_count
          else if (typeof responseData?.members_count === "number") {
            memberCount = responseData.members_count;
          }

          // حالت چهارم:
          // data خودش آرایه باشد
          else if (Array.isArray(responseData)) {
            memberCount = responseData.length;
          }

          // حالت پنجم
          else if (typeof membersResponse.data?.count === "number") {
            memberCount = membersResponse.data.count;
          }

          // حالت ششم
          else if (typeof membersResponse.data?.members_count === "number") {
            memberCount = membersResponse.data.members_count;
          }

          wallet.memberCount = memberCount;
        } catch (error) {
          console.error(`خطا در دریافت اعضای کیف پول ${walletId}:`, error);

          wallet.memberCount = 0;
        }
      }),
    );

    renderWallets();
  } catch (error) {
    console.error("Load wallets error:", error);

    wallets = [];

    renderWallets();

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطا در دریافت کیف پول‌ها",
      "error",
    );
  }
}

// ======================================================
// Load Wallet Currencies
// ======================================================

async function loadWalletCurrencies() {
  if (!walletCurrency) return;

  try {
    const response = await api.get("/currencies");

    const currencies =
      response.data?.data?.currencies || response.data?.currencies || [];

    walletCurrency.innerHTML = "";

    if (!Array.isArray(currencies)) {
      return;
    }

    currencies.forEach((currency) => {
      const option = document.createElement("option");

      option.value = currency.name ?? currency.code ?? currency.id;

      option.textContent = currency.name ?? currency.code ?? "ارز";

      walletCurrency.appendChild(option);
    });
  } catch (error) {
    console.error("Load currencies error:", error);

    walletCurrency.innerHTML = `
      <option value="">
        خطا در دریافت ارزها
      </option>
    `;
  }
}

// ======================================================
// Open Wallet Modal
// ======================================================

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

// ======================================================
// Close Wallet Modal
// ======================================================

function closeWalletModalFunc() {
  walletModal?.classList.add("hidden");

  walletForm?.reset();

  editingWalletId = null;

  nameModalError?.classList.add("hidden");

  modalBox?.classList.remove("animate");
}

// ======================================================
// Handle Wallet Submit
// ======================================================

async function handleWalletSubmit(event) {
  event.preventDefault();

  const name = walletName?.value.trim();

  const currency = walletCurrency?.value;

  if (!name) {
    nameModalError?.classList.remove("hidden");

    return;
  }

  nameModalError?.classList.add("hidden");

  // ==================================================
  // Edit
  // ==================================================

  if (editingWalletId !== null) {
    await updateWallet(editingWalletId, name);

    return;
  }

  // ==================================================
  // Create
  // ==================================================

  await createWallet(name, currency);
}

// ======================================================
// Create Wallet
// ======================================================

async function createWallet(name, currency) {
  try {
    const formData = new FormData();

    formData.append("name", name);

    formData.append("currency", currency);

    const response = await api.post("/wallet/create", formData);

    if (response.data?.success) {
      const createdWallet = response.data?.data;

      const walletId = createdWallet?.wallet_id ?? createdWallet?.id;

      if (walletId) {
        localStorage.setItem("walletId", walletId);
      }

      showToast("ساخت کیف پول با موفقیت انجام شد", "success");

      closeWalletModalFunc();

      // دوباره از API می‌گیریم
      // تا memberCount هم درست باشد
      await loadWallets();

      return;
    }

    showToast(response.data?.message || "ساخت کیف پول انجام نشد", "error");
  } catch (error) {
    console.error("Create wallet error:", error);

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطایی در ساخت کیف پول رخ داد",
      "error",
    );
  }
}

// ======================================================
// Render Wallets
// ======================================================

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

    const currencyName =
      wallet.currency?.name ?? wallet.currency?.code ?? wallet.currency ?? "";

    const balance = Number(wallet.balance ?? 0).toLocaleString("en-US");

    const memberCount = Number(wallet.memberCount ?? 0);

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
              ${escapeHTML(wallet.name || "کیف پول")}
            </h3>

            <span>
              ${escapeHTML(String(currencyName))}
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
          ${escapeHTML(String(currencyName))}
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

// ======================================================
// Wallet Buttons
// ======================================================

function setupWalletButtons() {
  // Delete
  document.querySelectorAll(".delete-wallet").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id);

      if (!confirm("آیا از حذف این کیف پول مطمئن هستید؟")) {
        return;
      }

      await deleteWallet(id);
    });
  });

  // Edit
  document.querySelectorAll(".edit-wallet").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);

      const wallet = wallets.find((item) => Number(getWalletId(item)) === id);

      if (!wallet) return;

      editingWalletId = id;

      walletName.value = wallet.name || "";

      const currency =
        wallet.currency?.name ?? wallet.currency?.code ?? wallet.currency ?? "";

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
      selectedWalletId = Number(button.dataset.id);

      openInviteModal();
    });
  });

  // Members
  document.querySelectorAll(".members-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const walletId = Number(button.dataset.id);

      if (!walletId) {
        showToast("کیف پول معتبر نیست", "error");
        return;
      }

      openMembersModal(walletId);
    });
  });
}

// ======================================================
// Remove Member
// ======================================================

async function removeMember(walletId, userId) {
  try {
    console.log("REMOVE MEMBER DATA:", {
      wallet_id: Number(walletId),
      user_id: Number(userId),
    });

    const response = await api.delete("/wallet/member/remove", {
      data: {
        wallet_id: Number(walletId),
        user_id: Number(userId),
      },
    });

    console.log("REMOVE MEMBER RESPONSE:", response.data);

    if (response.data?.success) {
      showToast("عضو با موفقیت حذف شد", "success");

      await loadWalletMembers(walletId);
      await loadWallets();

      return;
    }

    showToast(
      response.data?.message ||
        response.data?.data?.message ||
        "حذف عضو انجام نشد",
      "error",
    );
  } catch (error) {
    console.error("Remove member error:", error);
    console.log("ERROR RESPONSE:", error.response?.data);

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطا در حذف عضو",
      "error",
    );
  }
}

// ======================================================
// Member Buttons
// ======================================================

function setupMemberButtons() {
  document.querySelectorAll(".remove-member-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const walletId = Number(button.dataset.walletId);
      const userId = Number(button.dataset.userId);

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

// ======================================================
// Delete Wallet
// ======================================================

async function deleteWallet(walletId) {
  try {
    const response = await api.delete(`/wallet/delete/${walletId}`);

    if (response.data?.success) {
      showToast("کیف پول با موفقیت حذف شد", "success");

      if (Number(localStorage.getItem("walletId")) === Number(walletId)) {
        localStorage.removeItem("walletId");
      }

      await loadWallets();

      return;
    }

    showToast(response.data?.message || "حذف کیف پول انجام نشد", "error");
  } catch (error) {
    console.error("Delete wallet error:", error);

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطایی در حذف کیف پول رخ داد",
      "error",
    );
  }
}

// ======================================================
// Update Wallet
// ======================================================

async function updateWallet(walletId, name) {
  try {
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
    console.error("Update wallet error:", error);

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطا در ویرایش کیف پول",
      "error",
    );
  }
}

// ======================================================
// Invite Modal
// ======================================================

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

// ======================================================
// Invite Submit
// ======================================================

async function handleInviteSubmit(event) {
  event.preventDefault();

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

  try {
    const response = await api.post("/invitation/create", {
      wallet_id: Number(selectedWalletId),
      email: user,
    });

    if (response.data?.success) {
      showToast("دعوت‌نامه با موفقیت ارسال شد", "success");

      closeInviteModalFunc();

      await loadInvitations();

      // چون ممکن است تعداد اعضا
      // بعد از دعوت تغییر کند
      await loadWallets();

      return;
    }

    showToast(
      response.data?.message ||
        response.data?.data?.message ||
        "ارسال دعوت‌نامه انجام نشد",
      "error",
    );
  } catch (error) {
    console.error("Create invitation error:", error);

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطا در ارسال دعوت‌نامه",
      "error",
    );
  }
}

// ======================================================
// Load Invitations
// ======================================================

async function loadInvitations() {
  if (!invitationList) return;

  try {
    const response = await api.get("/invitations");

    console.log("INVITATIONS RESPONSE:", response.data);

    const receivedInvitations = response.data?.data?.received || [];

    const sentInvitations = response.data?.data?.sent || [];

    console.log("RECEIVED INVITATIONS:", receivedInvitations);
    console.log("SENT INVITATIONS:", sentInvitations);

    // هر دو نوع دعوت‌نامه را نگه می‌داریم
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

    console.log("DISPLAY INVITATIONS:", invitations);

    renderInvitations();
  } catch (error) {
    console.error("Load invitations error:", error);

    invitations = [];
    renderInvitations();
  }
}

// ======================================================
// Render Invitations
// ======================================================

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

    const invitationId = invitation.id ?? invitation.invitation_id;

    const status = invitation.status || "pending";

    const walletName =
      invitation.wallet?.name ||
      invitation.wallet_name ||
      invitation.walletName ||
      "کیف پول";

    // ==================================================
    // Received Invitation
    // ==================================================

    if (invitation.invitationType === "received") {
      const sender =
        invitation.sender?.name ||
        invitation.sender?.username ||
        invitation.sender?.email ||
        invitation.sender_name ||
        "کاربر";

      let actionHTML = "";

      // فقط دعوت در انتظار، دکمه قبول و رد دارد
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
          <span class="status ${escapeHTML(String(status))}">
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
              ${escapeHTML(String(walletName))}
            </h4>

            <p>
              ارسال شده توسط
              ${escapeHTML(String(sender))}
            </p>

          </div>

        </div>

        ${actionHTML}
      `;
    }

    // ==================================================
    // Sent Invitation
    // ==================================================
    else {
      const inviteeName =
        invitation.invitee?.name ||
        invitation.invitee?.username ||
        invitation.invitee?.email ||
        "کاربر";

      const inviteeEmail = invitation.invitee?.email || "";

      item.innerHTML = `
        <div class="invitation-info">

          <div class="invitation-icon">
            <i class="fas fa-paper-plane"></i>
          </div>

          <div>

            <h4>
              دعوت به
              ${escapeHTML(String(walletName))}
            </h4>

            <p>
              ارسال شده برای
              ${escapeHTML(String(inviteeName))}
            </p>

            ${
              inviteeEmail
                ? `
                  <small>
                    ${escapeHTML(String(inviteeEmail))}
                  </small>
                `
                : ""
            }

          </div>

        </div>

        <span class="status ${escapeHTML(String(status))}">
          ${getStatusText(status)}
        </span>
      `;
    }

    invitationList.appendChild(item);
  });

  setupInvitationButtons();
}

// ======================================================
// Invitation Buttons
// ======================================================

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

// ======================================================
// Respond Invitation
// ======================================================

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

    showToast(
      response.data?.message ||
        response.data?.data?.message ||
        "پاسخ به دعوت‌نامه انجام نشد",
      "error",
    );
  } catch (error) {
    console.error("Respond invitation error:", error);

    showToast(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "خطا در پاسخ به دعوت‌نامه",
      "error",
    );
  }
}

// ======================================================
// Status Text
// ======================================================

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

// ======================================================
// Escape HTML
// ======================================================

function escapeHTML(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}

// ======================================================
// Event Listeners
// ======================================================

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

// ======================================================
// Initial Load
// ======================================================

async function initWallet() {
  await Promise.all([loadWalletCurrencies(), loadWallets(), loadInvitations()]);
}

initWallet();
