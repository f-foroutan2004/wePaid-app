import axios from "axios";
const api = axios.create({
    baseURL: "http://wepaid.ir",
});

export default api;