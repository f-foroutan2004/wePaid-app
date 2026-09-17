import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

const emailInput = document.querySelector("#email");
const emailError = document.querySelector(".emailError");
const passwordInput = document.querySelector("#password");
const passwordError = document.querySelector(".passwordError");
const form = document.querySelector(".box");
const overlay = document.querySelector(".overlay");
const loginButton = document.querySelector(".signIn-btn");
const loginText = document.querySelector(".login-text");
const loginIcon = document.querySelector(".login-icon");
const localLoader = document.querySelector(".local-loader");
const passwordToggle = document.querySelector("#passwordToggle");

// Global Loader Functions
function showGlobalLoader() {
  overlay.classList.remove("hidden");
}

function hideGlobalLoader() {
  overlay.classList.add("hidden");
}

// Local Loader Functions

function showLocalLoader() {
  localLoader.classList.remove("hidden");
  loginIcon.classList.add("hidden");
  loginText.textContent = "در حال ورود...";
  loginButton.disabled = true;
}

function hideLocalLoader() {
  localLoader.classList.add("hidden");
  loginIcon.classList.remove("hidden");
  loginText.textContent = "ورود";
  loginButton.disabled = false;
}

function validation() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  // Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8}$/;

  // Email
  if (!emailRegex.test(email)) {
    emailError.classList.remove("hidden");

    isValid = false;
  } else {
    emailError.classList.add("hidden");
  }

  // Password
  if (!passwordRegex.test(password)) {
    passwordError.classList.remove("hidden");

    isValid = false;
  } else {
    passwordError.classList.add("hidden");
  }

  return isValid;
}

async function getToken(e) {
  e.preventDefault();

  const isValid = validation();
  if (!isValid) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const loginData = new FormData();
  loginData.append("email", email);
  loginData.append("password", password);

  try {
    showLocalLoader();

    const response = await api.post("/login", loginData);
    const successMessage = response.data?.data?.message;
    const token = response.data?.data?.token;

    localStorage.setItem("token", token);
    // localStorage.setItem("userName", userName);

    if (response) {
      showToast(successMessage, "success");

      // Redirect
      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 1000);
    }
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.data?.message || "ورود انجام نشد.";

      showToast(message);
    } else {
      showToast("ارتباط با سرور برقرار نشد.");
    }
  } finally {
    hideLocalLoader();
  }
}

// Event
form.addEventListener("submit", getToken);

passwordToggle.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";

    passwordToggle.classList.remove("fa-eye");
    passwordToggle.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";

    passwordToggle.classList.remove("fa-eye-slash");
    passwordToggle.classList.add("fa-eye");
  }
});