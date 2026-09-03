import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

//sign up
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
const overlay = document.querySelector(".overlay");

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

function validation() {
  let userName = userNameInput.value.trim();
  let email = emailInput.value.trim();
  const phoneNumber = phoneNumberInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  // Regex
  const usernameRegex = /^[a-zA-Z0-9_\u0600-\u06FF]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^09\d{9}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8}$/;

  // username
  if (!usernameRegex.test(userName)) {
    userNameError.classList.remove("hidden");
    isValid = false;
  } else {
    userNameError.classList.add("hidden");
  }

  // email
  if (!emailRegex.test(email)) {
    emailError.classList.remove("hidden");
    isValid = false;
  } else {
    emailError.classList.add("hidden");
  }

  // phone
  if (!phoneRegex.test(phoneNumber)) {
    phoneError.classList.remove("hidden");
    isValid = false;
  } else {
    phoneError.classList.add("hidden");
  }

  // password
  if (!passwordRegex.test(password)) {
    passwordError.classList.remove("hidden");
    isValid = false;
  } else {
    passwordError.classList.add("hidden");
  }

  return isValid;
}

async function validateStepOne() {
  const isValid = validation();

  if (!isValid) return;

  const userName = userNameInput.value.trim();
  localStorage.setItem("userName", userName);

  try {
    // show loader
    overlay.classList.remove("hidden");

    //get currency
    await loadCurrencies();

    //get successfully
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
  } catch (error) {
    console.error("Currency error:", error);

    showToast("دریافت لیست ارزها با مشکل مواجه شد.");
  } finally {
    overlay.classList.add("hidden");
  }
}

function validateStepTwo() {
  step1.classList.remove("hidden");
  step2.classList.add("hidden");
}

async function registerUser(e) {
  e.preventDefault();

  const userName = userNameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneNumberInput.value.trim();
  const password = passwordInput.value.trim();
  const currency = currencySelect.value;

  const data = new FormData();
  data.append("name", userName);
  data.append("email", email);
  data.append("password", password);
  data.append("phone_number", phone);
  data.append("currency", currency);

  try {
    const response = await api.post("/register", data);

    if (response) {
      showToast("ثبت‌ نام با موفقیت انجام شد", "success");

      //redirect to dashboard
      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 1000);
    }
  } catch (error) {
    if (error.response) {
      const message =
        error.response.data?.data?.message || "ثبت‌نام انجام نشد.";

      showToast(message);
    } else {
      showToast("ارتباط با سرور برقرار نشد.");
    }
  }
}

nextBtn.addEventListener("click", validateStepOne);
prevBtn.addEventListener("click", validateStepTwo);
form.addEventListener("submit", registerUser);

//installed lib
// function showToast(message, type = "error") {
//   Toastify({
//     text: message,
//     duration: 4000,
//     gravity: "top",
//     position: "right",
//     close: true,
//     style: {
//       background: type === "success" ? "#28a745" : "#e85d75",
//     },
//   }).showToast();
// }