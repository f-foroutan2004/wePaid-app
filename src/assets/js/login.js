//login
let emailInput = document.querySelector("#email");
const emailError = document.querySelector(".emailError");
let passwordInput = document.querySelector("#password");
const passwordError = document.querySelector(".passwordError");
const form = document.querySelector(".box");
const signInBtn = document.querySelector(".signIn-btn");

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

function finalValidate(e) {
  e.preventDefault();
  const isValid = validation();

  if (isValid) {
    e.target.submit();
    const userName = userNameInput.value.trim();
    localStorage.setItem("userName", userName);
  } else {
    return;
  }
}

form.addEventListener("submit", finalValidate);