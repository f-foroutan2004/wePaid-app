//login
let userNameInput = document.querySelector("#username");
let emailInput = document.querySelector("#email");
let phoneNumberInput = document.querySelector("#phone");
let passwordInput = document.querySelector("#password");
const userNameError = document.querySelector(".userNameError");
const emailError = document.querySelector(".emailError");
const phoneError = document.querySelector(".phoneError");
const passwordError = document.querySelector(".passwordError");
const form = document.querySelector(".box");
const nextBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");
const loginBtn = document.querySelector(".login-btn");
const step1 = document.querySelector(".step1");
const step2 = document.querySelector(".step2");

function validation() {
  let userName = userNameInput.value.trim();
  let email = emailInput.value.trim();
  const phoneNumber = phoneNumberInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  // Regex
  const usernameRegex = /^[a-zA-Z0-9_\u0600-\u06FF]{5,50}$/;
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

function validateStepOne() {
  const isValid = validation();

  if (!isValid) {
    return;
  }

  const userName = userNameInput.value.trim();
  localStorage.setItem("userName", userName)

  step1.classList.add("hidden");
  step2.classList.remove("hidden");
}

function validateStepTwo() {
  step1.classList.remove("hidden");
  step2.classList.add("hidden");
}

function finalValidate(e) {
  e.preventDefault();
  e.target.submit();
}

nextBtn.addEventListener("click", validateStepOne);
prevBtn.addEventListener("click", validateStepTwo);
form.addEventListener("submit", finalValidate);

// document.addEventListener("DOMContentLoaded", function () {
//   const loader = document.querySelector(".loader");

//   loader.computedStyleMap.display = "none";
// });