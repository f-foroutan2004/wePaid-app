const usernameElement = document.querySelector("#headerUsername");
const ctxCircle = document.querySelector(".incomeChart");
const ctxLine = document.querySelector(".processChart");

const username = localStorage.getItem("userName");

if (username) {
  usernameElement.textContent = username;
} else {
  usernameElement.textContent = "کاربر";
}

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
