const token = localStorage.getItem("token");

const currentPage = window.location.pathname.split("/").pop();

//logged out user
const guestPages = ["login.html", "register.html"];

//logged in user
const protectedPages = [
  "dashboard.html",
  "transaction.html",
  "budget.html",
  "setting.html",
  "wallet.html",
  "profile.html",
];

if (token) {
  if (guestPages.includes(currentPage)) {
    window.location.replace("./dashboard.html");
  }
}
else {
  if (protectedPages.includes(currentPage)) {
    window.location.replace("./login.html");
  }
}