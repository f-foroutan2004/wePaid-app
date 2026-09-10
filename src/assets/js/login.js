import api from "./api.js";
import { showToast } from "../../utils/Toast.js";

//login
let emailInput = document.querySelector("#email");
const emailError = document.querySelector(".emailError");
let passwordInput = document.querySelector("#password");
const passwordError = document.querySelector(".passwordError");
const form = document.querySelector(".box");

function validation() {
  let email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  // Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8}$/;

  // email
  if (!emailRegex.test(email)) {
    emailError.classList.remove("hidden");
    isValid = false;
  } else {
    emailError.classList.add("hidden");
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
    const response = await api.post("/login", loginData);
    const successMessage = response.data?.data?.message;
    localStorage.setItem("token", response.data.data.token);

    if (response) {
      showToast(successMessage, "success");

      // redirect to dashboard
      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 1000);
    }
  } catch (error) {
    console.log(error);
    if (error.response) {
      const message = error.response.data?.data?.message;

      showToast(message);
    } else {
      showToast("ارتباط با سرور برقرار نشد.");
    }
  }
}

form.addEventListener("submit", getToken);
