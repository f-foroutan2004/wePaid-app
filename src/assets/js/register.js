import api from "./api.js";

import { showToast } from "../../utils/Toast.js";


// ======================================================
// Sign Up
// ======================================================


// ======================================================
// Elements
// ======================================================

const userNameInput = document.querySelector("#username");

const emailInput = document.querySelector("#email");

const phoneNumberInput = document.querySelector("#phone");

const passwordInput = document.querySelector("#password");

const userNameError = document.querySelector(".userNameError");

const emailError = document.querySelector(".emailError");

const phoneError = document.querySelector(".phoneError");

const passwordError = document.querySelector(".passwordError");

const form = document.querySelector(".box");

const nextBtn = document.querySelector(".next-btn");

const prevBtn = document.querySelector(".prev-btn");

const step1 = document.querySelector(".step1");

const step2 = document.querySelector(".step2");

const currencySelect = document.querySelector("#currency");


// ======================================================
// Global Loader Elements
// ======================================================

const overlay = document.querySelector(".overlay");


// ======================================================
// Local Loader Elements
// ======================================================

const registerButton = document.querySelector(".signUp-create-btn");

const localLoader = document.querySelector(".local-loader");

const registerIcon = document.querySelector(".register-icon");

const registerText = document.querySelector(".register-text");


// ======================================================
// Global Loader Functions
// ======================================================

function showGlobalLoader() {

  overlay.classList.remove("hidden");

}


function hideGlobalLoader() {

  overlay.classList.add("hidden");

}


// ======================================================
// Local Loader Functions
// ======================================================

function showLocalLoader() {

  localLoader.classList.remove("hidden");

  registerIcon.classList.add("hidden");

  registerText.textContent = "در حال ثبت...";

  registerButton.disabled = true;

}


function hideLocalLoader() {

  localLoader.classList.add("hidden");

  registerIcon.classList.remove("hidden");

  registerText.textContent = "ایجاد حساب";

  registerButton.disabled = false;

}


// ======================================================
// Load Currencies
// ======================================================

async function loadCurrencies() {

  const response = await api.get("/currencies");

  const currencies = response.data.data.currencies;

  currencySelect.innerHTML = "";

  currencies.forEach((currency) => {

    const option = document.createElement("option");

    option.value = currency.name;

    option.textContent = currency.name;

    currencySelect.appendChild(option);

  });

}


// ======================================================
// Validation
// ======================================================

function validation() {

  const userName = userNameInput.value.trim();

  const email = emailInput.value.trim();

  const phoneNumber = phoneNumberInput.value.trim();

  const password = passwordInput.value.trim();

  let isValid = true;


  // ======================================================
  // Regex
  // ======================================================

  const usernameRegex =
    /^[a-zA-Z0-9_\u0600-\u06FF]{2,50}$/;

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const phoneRegex =
    /^09\d{9}$/;

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8}$/;


  // ======================================================
  // Username
  // ======================================================

  if (!usernameRegex.test(userName)) {

    userNameError.classList.remove("hidden");

    isValid = false;

  } else {

    userNameError.classList.add("hidden");

  }


  // ======================================================
  // Email
  // ======================================================

  if (!emailRegex.test(email)) {

    emailError.classList.remove("hidden");

    isValid = false;

  } else {

    emailError.classList.add("hidden");

  }


  // ======================================================
  // Phone
  // ======================================================

  if (!phoneRegex.test(phoneNumber)) {

    phoneError.classList.remove("hidden");

    isValid = false;

  } else {

    phoneError.classList.add("hidden");

  }


  // ======================================================
  // Password
  // ======================================================

  if (!passwordRegex.test(password)) {

    passwordError.classList.remove("hidden");

    isValid = false;

  } else {

    passwordError.classList.add("hidden");

  }


  return isValid;

}


// ======================================================
// Validate Step One
// ======================================================

async function validateStepOne() {

  const isValid = validation();

  if (!isValid) return;


  const userName = userNameInput.value.trim();

  localStorage.setItem("userName", userName);


  try {

    // ==================================================
    // Global Loader ON
    // ==================================================

    showGlobalLoader();


    // ==================================================
    // Get Currencies
    // ==================================================

    await loadCurrencies();


    // ==================================================
    // Go To Step 2
    // ==================================================

    step1.classList.add("hidden");

    step2.classList.remove("hidden");


  } catch (error) {

    console.error("Currency error:", error);

    showToast(
      "دریافت لیست ارزها با مشکل مواجه شد."
    );


  } finally {

    // ==================================================
    // Global Loader OFF
    // ==================================================

    hideGlobalLoader();

  }

}


// ======================================================
// Back To Step One
// ======================================================

function validateStepTwo() {

  step1.classList.remove("hidden");

  step2.classList.add("hidden");

}


// ======================================================
// Register User
// ======================================================

async function registerUser(e) {

  e.preventDefault();


  const userName = userNameInput.value.trim();

  const email = emailInput.value.trim();

  const phone = phoneNumberInput.value.trim();

  const password = passwordInput.value.trim();

  const currency = currencySelect.value;


  // ==================================================
  // FormData
  // ==================================================

  const data = new FormData();

  data.append("name", userName);

  data.append("email", email);

  data.append("password", password);

  data.append("phone_number", phone);

  data.append("currency", currency);


  try {

    // ==================================================
    // Local Loader ON
    // ==================================================

    showLocalLoader();


    // ==================================================
    // Register API
    // ==================================================

    const response = await api.post(
      "/register",
      data
    );


    // ==================================================
    // Success
    // ==================================================

    if (response) {

      showToast(
        "ثبت‌ نام با موفقیت انجام شد",
        "success"
      );


      // ==================================================
      // Redirect
      // ==================================================

      setTimeout(() => {

        window.location.href =
          "./login.html";

      }, 1000);

    }


  } catch (error) {

    console.error(
      "Register error:",
      error
    );


    // ==================================================
    // Backend Error
    // ==================================================

    if (error.response) {

      const message =
        error.response.data?.data?.message ||
        "ثبت‌نام انجام نشد.";


      showToast(message);


    } else {

      showToast(
        "ارتباط با سرور برقرار نشد."
      );

    }


  } finally {

    // ==================================================
    // Local Loader OFF
    // ==================================================

    hideLocalLoader();

  }

}


// ======================================================
// Events
// ======================================================

nextBtn.addEventListener(
  "click",
  validateStepOne
);


prevBtn.addEventListener(
  "click",
  validateStepTwo
);


form.addEventListener(
  "submit",
  registerUser
);