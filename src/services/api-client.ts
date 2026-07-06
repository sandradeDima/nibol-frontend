import axios from "axios";

import { APP_CONFIG } from "@/lib/constants";
import { getApiErrorMessage } from "@/utils";

export const apiClient = axios.create({
  baseURL: APP_CONFIG.browserApiBaseUrl,
  timeout: APP_CONFIG.apiTimeoutMs,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(new Error(getApiErrorMessage(error))),
);
