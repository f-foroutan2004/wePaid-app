//login
let userNameInput = document.querySelector("#username");
let passwordInput = document.querySelector("#password");
const userNameError = document.querySelector(".userNameError");
const passwordError = document.querySelector(".passwordError");
const form = document.querySelector(".box");
const signInBtn = document.querySelector(".signIn-btn");

function validation() {
  let userName = userNameInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  // Regex
  const usernameRegex = /^[a-zA-Z0-9_\u0600-\u06FF]{5,50}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8}$/;

  // username
  if (!usernameRegex.test(userName)) {
    userNameError.classList.remove("hidden");
    isValid = false;
  } else {
    userNameError.classList.add("hidden");
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
