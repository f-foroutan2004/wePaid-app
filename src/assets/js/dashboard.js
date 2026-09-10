const usernameElement = document.querySelector("#headerUsername");
const ctxCircle = document.querySelector(".incomeChart");
const ctxLine = document.querySelector(".processChart");
const totalBalance = document.querySelector(".total-balance");
const incomeBalance = document.querySelector(".income-balance");
const expenseBalance = document.querySelector(".expense-balance");

// Username
const username = localStorage.getItem("userName");
usernameElement.textContent = username || "کاربر";

//animate Numbers
function animateNumber(element, target, duration = 1500) {
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const currentValue = Math.floor(target * progress);

    element.textContent = `$ ${currentValue.toLocaleString("en-US")}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}
const totalBalanceValue = 12500;
const incomeValue = 4500;
const expenseValue = 2100;

animateNumber(totalBalance, totalBalanceValue);
animateNumber(incomeBalance, incomeValue);
animateNumber(expenseBalance, expenseValue);

//charts
new Chart(ctxCircle, {
  type: "doughnut",

  data: {
    labels: ["غذا", "حمل و نقل", "تفریح"],
    datasets: [
      {
        data: [70, 45, 30],
      },
    ],
  },
  options: {
    plugins: {
      legend: {
        labels: {
          font: {
            size: 14,
            family: "VazirMatn",
          },
        },
      },
    },
  },
});

new Chart(ctxLine, {
  type: "line",

  data: {
    labels: ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور"],
    datasets: [
      {
        label: "درآمد",
        data: [5000, 6250, 8000, 5555, 2000],
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "هزینه",
        data: [4000, 8250, 10000, 5555, 20000],
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: {
            size: 14,
            family: "VazirMatn",
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10,
            family: "VazirMatn",
          },
        },
      },
    },
  },
});

//animate budget progress 
document.addEventListener("DOMContentLoaded", () => {
  const budgets = document.querySelectorAll(".budget");

  budgets.forEach((budget) => {
    const percentText = budget.querySelector(".budget-info span:last-child");
    const progress = budget.querySelector(".progress span");

    const percent = parseInt(percentText.textContent);

    progress.style.backgroundColor = "#6d28d9";

    setTimeout(() => {
      progress.style.width = `${percent}%`;
    }, 100);
  });
});
