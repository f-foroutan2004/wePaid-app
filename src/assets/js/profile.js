import api from "./api.js";

// ==================== DOM Elements ====================

const profileForm = document.getElementById("profileForm");
const usernameInput = document.getElementById("username");
const currencySelect = document.getElementById("currency");
const headerUsername = document.getElementById("headerUsername");
const nameError = document.querySelector(".nameError");

// ==================== Profile Data ====================

let profile = JSON.parse(localStorage.getItem("profile")) || {
  username: "",
  currency: "",
};

// ==================== Load Currencies ====================

async function loadCurrencies() {
  try {
    // Show loading state
    currencySelect.innerHTML = `
      <option value="">در حال دریافت ارزها...</option>
    `;

    currencySelect.disabled = true;

    const response = await api.get("/currencies");

    const currencies = response.data.data.currencies;

    // Clear select
    currencySelect.innerHTML = "";

    // Add currencies
    currencies.forEach((currency) => {
      const option = document.createElement("option");

      option.value = currency.name;
      option.textContent = currency.name;

      currencySelect.appendChild(option);
    });

    // Select saved currency
    if (profile.currency) {
      currencySelect.value = profile.currency;
    }

    currencySelect.disabled = false;
  } catch (error) {
    console.error("Error loading currencies:", error);

    currencySelect.innerHTML = `
      <option value="">خطا در دریافت ارزها</option>
    `;

    currencySelect.disabled = false;
  }
}

// ==================== Load Profile ====================

function loadProfile() {
  const username = localStorage.getItem("userName");

  usernameInput.value = profile.username || "";

  headerUsername.textContent = username || "کاربر";
}

// ==================== Save Profile ====================

function saveProfile() {
  localStorage.setItem("profile", JSON.stringify(profile));
}

// ==================== Profile Form Submit ====================

function handleProfileSubmit(event) {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const currency = currencySelect.value;

  // Validate username
  if (username === "") {
    nameError.classList.remove("hidden");
    return;
  }

  nameError.classList.add("hidden");

  // Update profile
  profile = {
    username,
    currency,
  };

  // Save in localStorage
  saveProfile();

  // Update header
  headerUsername.textContent = username;

  alert("تغییرات با موفقیت ذخیره شد.");
}

// ==================== Username Input ====================

function handleUsernameInput() {
  if (usernameInput.value.trim() !== "") {
    nameError.classList.add("hidden");
  }
}

// ==================== Initialize Profile ====================

export async function initProfile() {
  loadProfile();

  await loadCurrencies();

  profileForm.addEventListener("submit", handleProfileSubmit);

  usernameInput.addEventListener("input", handleUsernameInput);
}