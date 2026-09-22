import api from "../assets/js/api";

const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const headerUsername = document.getElementById("headerUsername");
const logoutBtn = document.getElementById("logoutBtn");

// Load User Profile
async function loadProfile() {
  try {
    const response = await api.get("/me");

    const user = response.data?.data?.user;
    if (!user) return;

    // Name
    profileName.textContent = user.name || "-";

    // Email
    profileEmail.textContent = user.email || "-";

    // Phone
    profilePhone.textContent = user.phone_number || "-";

    // Header username
    if (headerUsername) {
      headerUsername.textContent = user.name || "";
    }
  } catch (error) {
    console.error("خطا در دریافت اطلاعات کاربر:", error);
  }
}

// Open Profile
if (profileBtn && profileDropdown) {
  profileBtn.addEventListener("click", async (event) => {
    event.stopPropagation();

    const isHidden = profileDropdown.classList.contains("hidden");

    profileDropdown.classList.toggle("hidden");

    if (isHidden) {
      await loadProfile();
    }
  });
}

// Close Profile
document.addEventListener("click", (event) => {
  if (
    profileDropdown &&
    profileBtn &&
    !profileDropdown.contains(event.target) &&
    !profileBtn.contains(event.target)
  ) {
    profileDropdown.classList.add("hidden");
  }
});

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");

    window.location.href = "./login.html";
  });
}
