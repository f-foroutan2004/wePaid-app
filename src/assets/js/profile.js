import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

//Element
const profileForm = document.getElementById("profileForm");
const usernameInput = document.getElementById("username");
const currencySelect = document.getElementById("currency");
const headerUsername = document.getElementById("headerUsername");
const nameError = document.querySelector(".nameError");

// Local Loader
function showProfileLoader() {
  if (usernameInput) {
    usernameInput.value = "در حال دریافت...";
    usernameInput.disabled = true;
  }

  if (currencySelect) {
    currencySelect.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = "در حال دریافت...";

    currencySelect.appendChild(option);
    currencySelect.disabled = true;
  }
}

function hideProfileLoader() {
  if (usernameInput) {
    usernameInput.disabled = false;
  }

  if (currencySelect) {
    currencySelect.disabled = false;
  }
}

// GET PROFILE
async function loadProfile() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("توکن ورود پیدا نشد.", "error");
      return;
    }

    const response = await api.get("/profile");
    const profileData = response.data?.data?.profile;
    if (!profileData) return;

    // Name
    const name = profileData.name ?? "";

    // Currency ID
    const currencyId = profileData.currency?.id ?? "";

    if (usernameInput) {
      usernameInput.value = name;
    }

    if (currencySelect && currencyId !== "") {
      currencySelect.value = String(currencyId);
    }

    if (name) {
      localStorage.setItem("userName", name);
    }

    // Header
    if (headerUsername) {
      headerUsername.textContent = name || "کاربر";
    }
  } catch (error) {
    const message =
      error.response?.data?.data?.message || "خطا در دریافت پروفایل.";
    showToast(message);
  }
}

// GET CURRENCIES
async function loadCurrencies() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("توکن ورود پیدا نشد.");
      return;
    }

    const response = await api.get("/currencies");
    const currencies = response.data?.data?.currencies || [];

    if (!currencySelect) return;

    currencySelect.innerHTML = "";

    if (!Array.isArray(currencies) || currencies.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "واحد پولی پیدا نشد";

      currencySelect.appendChild(option);
      return;
    }

    currencies.forEach((currency) => {
      const option = document.createElement("option");

      if (typeof currency === "object") {
        const id = currency.id;
        const name = currency.name || "";
        option.value = id ?? "";
        option.textContent = name;
      } else {
        option.value = currency;
        option.textContent = currency;
      }

      currencySelect.appendChild(option);
    });
  } catch (error) {
    const message =
      error.response?.data?.data?.message ||
      "دریافت واحدهای پولی با خطا مواجه شد.";

    showToast(message, "error");
  }
}

// UPDATE PROFILE
async function saveProfile(name, currencyId) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("توکن ورود پیدا نشد.", "error");
      return false;
    }

    const profileData = {
      name: name,
      currency_id: +currencyId,
    };

    const response = await api.put("/profile/update", profileData);
    localStorage.setItem("userName", name);

    if (headerUsername) {
      headerUsername.textContent = name;
    }

    showToast(
      response.data?.message || "پروفایل با موفقیت ذخیره شد.",
      "success",
    );

    return true;
  } catch (error) {
    const message =
      error.response?.data?.message || "ذخیره پروفایل با خطا مواجه شد.";
    showToast(message, "error");

    return false;
  }
}

// FORM SUBMIT
async function handleProfileSubmit(event) {
  event.preventDefault();

  const name = usernameInput?.value.trim();
  const currencyId = currencySelect?.value;

  // Name validation
  if (!name) {
    if (nameError) {
      nameError.textContent = "نام الزامی است.";
      nameError.style.display = "block";
    }

    usernameInput?.focus();

    return;
  }

  if (nameError) {
    nameError.textContent = "";
    nameError.style.display = "none";
  }

  // Currency validation
  if (!currencyId) {
    showToast("لطفاً واحد پول را انتخاب کنید.", "error");

    return;
  }

  try {
    await saveProfile(name, currencyId);
  } finally {
    hideProfileLoader();
  }
}

// Name Input
function handleNameInput() {
  if (!nameError) return;
  nameError.textContent = "";
  nameError.style.display = "none";
}

// INIT
export async function initProfile() {
  showProfileLoader();

  try {
    await loadCurrencies();
    await loadProfile();
  } finally {
    hideProfileLoader();
  }

  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSubmit);
  }

  if (usernameInput) {
    usernameInput.addEventListener("input", handleNameInput);
  }
}