import axios from "axios";
import { ACCESS_TOKEN } from "../constants";


// Set this to true to use local backend, false for production
const USE_LOCAL_BACKEND = true;
const LOCAL_BASE_URL = "http://127.0.0.1:7000";
const PROD_BASE_URL = "";
const BASE_URL = USE_LOCAL_BACKEND ? LOCAL_BASE_URL : PROD_BASE_URL;


const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use(
  (config) => {
  const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const signupUser = async (userData) => {
  const response = await api.post("/users/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await api.post("/users/login", userData);
  return response.data;
};

export default api;


// export const getImageUrl = (path) => {
//   if (!path) return "";
//   if (path.startsWith("http")) return path;
//   return `${BASE_URL}${path}`;
// };

// export const fetchSiteSettings = async () => {
//   const response = await api.get("/site-settings/");
//   const data = response.data[0];
//   if (data.logo) {
//     data.logo = getImageUrl(data.logo);
//   }
//   return data;
// };

// export const fetchProducts = async () => {
//   const response = await api.get("/products/");
//   return response.data.map((product) => ({
//     ...product,
//     image: getImageUrl(product.image),
//   }));
// };

// export const fetchCategories = async () => {
//   const response = await api.get("/categories/");
//   return response.data;
// };

// export const fetchReviews = async () => {
//   const response = await api.get("/reviews/");
//   return response.data.map((review) => ({
//     ...review,
//     image: getImageUrl(review.image),
//   }));
// };

// export const submitReview = async (reviewData) => {
//   const formData = new FormData();
//   Object.keys(reviewData).forEach((key) => {
//     formData.append(key, reviewData[key]);
//   });
//   const response = await api.post("/reviews/", formData, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },
//   });
//   return response.data;
// };

// export const fetchTeamMembers = async () => {
//   const response = await api.get("/team-members/");
//   return response.data.map((member) => ({
//     ...member,
//     image: getImageUrl(member.image),
//   }));
// };

// export const fetchMilestones = async () => {
//   const response = await api.get("/milestones/");
//   return response.data;
// };

// export const fetchValues = async () => {
//   const response = await api.get("/values/");
//   return response.data;
// };

// export const fetchFAQs = async () => {
//   const response = await api.get("/faqs/");
//   return response.data;
// };

// export const submitContactForm = async (formData) => {
//   // Ensure WhatsApp number is included in the payload
//   const response = await api.post("/contact/", formData);
//   return response.data;
// };

// export const createOrder = async (orderData) => {
//   const response = await api.post("/orders/", orderData);
//   return response.data;
// };

// export const submitOrder = async (orderData) => {
//   // Send order to the correct endpoint for checkout
//   const response = await api.post("/orders/checkout/", orderData);
//   return response.data;
// };

