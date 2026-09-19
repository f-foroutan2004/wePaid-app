import api from "../../src/assets/js/api.js";

// Elements
const notificationBtn = document.getElementById("notificationBtn");
const notificationBadge = document.getElementById("notificationBadge");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationList = document.getElementById("notificationList");

let notifications = [];

function shakeNotificationBell() {
  const notificationBtn = document.getElementById("notificationBtn");

  if (!notificationBtn) return;

  notificationBtn.classList.remove("shake");
  void notificationBtn.offsetWidth;
  notificationBtn.classList.add("shake");
}


// Load Notifications
async function loadNotifications() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const response = await api.get("/notifications");
    shakeNotificationBell();

    if (!response.data?.success) return;

    notifications = response.data.data?.notifications || [];

    updateNotificationBadge();
    renderNotifications();
  } catch (error) {
    console.error("خطا در دریافت اعلان‌ها:", error);
  }
}

// Badge
function updateNotificationBadge() {
  const count = notifications.length;

  if (count > 0) {
    notificationBadge.textContent = count > 99 ? "99+" : count;
    notificationBadge.classList.remove("hidden");
  } else {
    notificationBadge.classList.add("hidden");
  }
}

// Render Notifications
function renderNotifications() {
  if (!notifications.length) {
    notificationList.innerHTML = `
      <div class="notification-empty">
        اعلانی وجود ندارد
      </div>
    `;

    return;
  }

  notificationList.innerHTML = notifications
    .map((notification) => {
      return `
        <div class="notification-item">

          <div class="notification-item-title">
            ${notification.title || "اعلان"}
          </div>

          <div class="notification-item-message">
            ${notification.message || ""}
          </div>

          ${
            notification.wallet_name
              ? `
                <div class="notification-item-wallet">
                  کیف پول: ${notification.wallet_name}
                </div>
              `
              : ""
          }

        </div>
      `;
    })
    .join("");
}

// Open / Close Dropdown
notificationBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  notificationDropdown.classList.toggle("hidden");
});

// Close when clicking outside
document.addEventListener("click", (event) => {
  if (
    notificationDropdown &&
    !notificationDropdown.contains(event.target) &&
    !notificationBtn.contains(event.target)
  ) {
    notificationDropdown.classList.add("hidden");
  }
});

// Polling - Every 20 Seconds
loadNotifications();
setInterval(() => {
  loadNotifications();
}, 20000);

export { loadNotifications, updateNotificationBadge, renderNotifications };