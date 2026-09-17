import api from "./api.js";

import { showToast } from "../../utils/Toast.js";

const profileForm =
  document.getElementById(
    "profileForm",
  );

const usernameInput =
  document.getElementById(
    "username",
  );

const currencySelect =
  document.getElementById(
    "currency",
  );

const headerUsername =
  document.getElementById(
    "headerUsername",
  );

const nameError =
  document.querySelector(
    ".nameError",
  );

// ======================================================
// Skeleton Loading
// ======================================================

function showProfileSkeleton() {
  if (usernameInput) {
    usernameInput.classList.add(
      "skeleton",
    );

    usernameInput.value = "";

    usernameInput.disabled = true;
  }

  if (currencySelect) {
    currencySelect.classList.add(
      "skeleton",
    );

    currencySelect.disabled = true;
  }
}

function hideProfileSkeleton() {
  if (usernameInput) {
    usernameInput.classList.remove(
      "skeleton",
    );

    usernameInput.disabled = false;
  }

  if (currencySelect) {
    currencySelect.classList.remove(
      "skeleton",
    );

    currencySelect.disabled = false;
  }
}

// ======================================================
// GET PROFILE
// ======================================================

async function loadProfile() {
  try {
    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      showToast(
        "توکن ورود پیدا نشد.",
        "error",
      );

      return;
    }

    const response =
      await api.get("/profile");

    const profileData =
      response.data?.data?.profile;

    if (!profileData) {
      throw new Error(
        "Profile data not found",
      );
    }

    // Name
    const name =
      profileData.name ?? "";

    // Currency ID
    const currencyId =
      profileData.currency?.id ??
      "";

    if (usernameInput) {
      usernameInput.value =
        name;
    }

    if (
      currencySelect &&
      currencyId !== ""
    ) {
      currencySelect.value =
        String(currencyId);
    }

    if (name) {
      localStorage.setItem(
        "userName",
        name,
      );
    }

    // Header
    if (headerUsername) {
      headerUsername.textContent =
        name || "کاربر";
    }
  } catch (error) {
    console.error(
      "Load profile error:",
      error,
    );

    const message =
      error.response?.data
        ?.message ||
      error.response?.data
        ?.data?.message ||
      "خطا در دریافت پروفایل.";

    showToast(
      message,
      "error",
    );
  }
}

// ======================================================
// GET CURRENCIES
// ======================================================

async function loadCurrencies() {
  try {
    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      showToast(
        "توکن ورود پیدا نشد.",
        "error",
      );

      return;
    }

    const response =
      await api.get(
        "/currencies",
      );

    const currencies =
      response.data?.data
        ?.currencies || [];

    if (!currencySelect) {
      return;
    }

    currencySelect.innerHTML =
      "";

    if (
      !Array.isArray(
        currencies,
      ) ||
      currencies.length === 0
    ) {
      const option =
        document.createElement(
          "option",
        );

      option.value = "";

      option.textContent =
        "واحد پولی پیدا نشد";

      currencySelect.appendChild(
        option,
      );

      return;
    }

    currencies.forEach(
      (currency) => {
        const option =
          document.createElement(
            "option",
          );

        if (
          typeof currency ===
          "object"
        ) {
          const id =
            currency.id ??
            currency.currency_id ??
            currency.currencyId;

          const name =
            currency.name ??
            currency.title ??
            currency.currency_name ??
            currency.code ??
            "";

          option.value =
            id ?? "";

          option.textContent =
            name;
        } else {
          option.value =
            currency;

          option.textContent =
            currency;
        }

        currencySelect.appendChild(
          option,
        );
      },
    );
  } catch (error) {
    console.error(
      "Load currencies error:",
      error,
    );

    const message =
      error.response?.data
        ?.message ||
      error.response?.data
        ?.data?.message ||
      "دریافت واحدهای پولی با خطا مواجه شد.";

    showToast(
      message,
      "error",
    );
  }
}

// ======================================================
// UPDATE PROFILE
// ======================================================

async function saveProfile(
  name,
  currencyId,
) {
  try {
    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      showToast(
        "توکن ورود پیدا نشد.",
        "error",
      );

      return false;
    }

    const profileData = {
      name: name,
      currency_id:
        Number(currencyId),
    };

    const response =
      await api.put(
        "/profile/update",
        profileData,
      );

    localStorage.setItem(
      "userName",
      name,
    );

    if (headerUsername) {
      headerUsername.textContent =
        name;
    }

    showToast(
      response.data?.message ||
        "پروفایل با موفقیت ذخیره شد.",
      "success",
    );

    return true;
  } catch (error) {
    const message =
      error.response?.data
        ?.message ||
      error.response?.data
        ?.error ||
      "ذخیره پروفایل با خطا مواجه شد.";

    showToast(
      message,
      "error",
    );

    return false;
  }
}

// ======================================================
// FORM SUBMIT
// ======================================================

async function handleProfileSubmit(
  event,
) {
  event.preventDefault();

  const name =
    usernameInput?.value.trim();

  const currencyId =
    currencySelect?.value;

  // Name validation
  if (!name) {
    if (nameError) {
      nameError.textContent =
        "نام الزامی است.";

      nameError.style.display =
        "block";
    }

    usernameInput?.focus();

    return;
  }

  if (nameError) {
    nameError.textContent = "";

    nameError.style.display =
      "none";
  }

  // Currency validation
  if (!currencyId) {
    showToast(
      "لطفاً واحد پول را انتخاب کنید.",
      "error",
    );

    return;
  }

  // Save
  await saveProfile(
    name,
    currencyId,
  );
}

// ======================================================
// Name Input
// ======================================================

function handleNameInput() {
  if (!nameError) return;

  nameError.textContent = "";

  nameError.style.display =
    "none";
}

// ======================================================
// INIT
// ======================================================

export async function initProfile() {
  showProfileSkeleton();

  try {
    await loadCurrencies();
    await loadProfile();
  } finally {
    hideProfileSkeleton();
  }

  if (profileForm) {
    profileForm.addEventListener(
      "submit",
      handleProfileSubmit,
    );
  }

  if (usernameInput) {
    usernameInput.addEventListener(
      "input",
      handleNameInput,
    );
  }
}

// ======================================================
// EXPORT
// ======================================================

export {
  loadProfile,
  loadCurrencies,
  saveProfile,
};