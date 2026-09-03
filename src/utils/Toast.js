import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export function showToast(message, type = "error") {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "right",
    close: true,
    style: {
      background: type === "success" ? "#28a745" : "#e85d75",
    },
  }).showToast();
}