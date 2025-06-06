import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { parseCookies } from "./helpers";

type BaseURL = "api" | "app" | "api_new" | string;

/**
 * Base URL builder.
 * @param base "api" | "app" | "api_new"
 * @param {Record<string, string>} headers Additional headers
 * @returns Base of URL
 *
 * @example "api"   -> "https://[NEXT_PUBLIC_API_URL]/"
 * @example "app" -> "https://[NEXT_PUBLIC_APP_URL]/"
 * @example "api_new" -> "https://[NEXT_PUBLIC_API_URL_NEW]/"
 */
const instance = (base: BaseURL, headers: Record<string, string> = {}) => {
  const urls: Record<BaseURL, string> = {
    api: process.env.NEXT_PUBLIC_API_URL ?? "",
    app: process.env.NEXT_PUBLIC_APP_URL ?? "",
    api_new: process.env.NEXT_PUBLIC_API_URL_NEW ?? "",
  };

  const authorization =
    base === "api" || base === "api_new"
      ? process.env.NEXT_PUBLIC_API_TOKEN
      : process.env.NEXT_PUBLIC_AUTHORIZATION_TOKEN;

  const config: AxiosRequestConfig = {
    baseURL: urls[base] || base,
    headers: {
      Authorization: `Bearer ${authorization}`,
      ...headers,
    },
  };
  return axios.create(config);
};

/**
 * Universal GET helper function.
 * @param {string} route Endpoint URL
 * @param {Record<string, string>} params Queries
 * @param {"api" | "app"} base api | local
 * @returns {Promise<AxiosResponse>} Promised response
 */
export const get = (
  route: string,
  params?: Record<string, any>,
  base: BaseURL = "api"
): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
    instance(base)
      .get(route, { params })
      .then((response: AxiosResponse) => resolve(response))
      .catch((err) => reject(err));
  });
};

/**
 * Universal GET helper function for the new API endpoint.
 * @param {string} route Endpoint URL
 * @param {Record<string, string>} params Queries
 * @param {"api_new" | "app"} base api_new | local
 * @returns {Promise<AxiosResponse>} Promised response
 */
export const getNew = (
  route: string,
  params?: Record<string, any>,
  base: BaseURL = "api_new"
): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
    instance(base)
      .get(route, { params })
      .then((response: AxiosResponse) => resolve(response))
      .catch((err) => reject(err));
  });
};

/**
 * Universal POST helper function.
 * @param route Endpoint route
 * @param payload Body payload
 * @param {"api" | "app"} base api | local
 * @param {Record<string, string>} headers Additional headers
 * @returns {Promise<AxiosResponse>} Promised response
 */
export const post = (
  route: string,
  payload?: any,
  base: BaseURL = "api",
  headers: Record<string, string> = {}
): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
    instance(base, headers)
      .post(route, payload)
      .then((response: AxiosResponse) => resolve(response))
      .catch((err) => reject(err));
  });
};

/**
 * POST for AI service-based endpoints. Axios does not support text-stream requests. [https://github.com/axios/axios/issues/479]
 * Might be a good time to move away from axios in the future.
 * @param route Endpoint
 * @param payload Body
 * @returns {Promise<Response>} Text
 */
export const stream = (route: string, payload?: any): Promise<Response> => {
  return fetch(process.env.NEXT_PUBLIC_AI_URL + route, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      Authorization: `Bearer ${parseCookies(document.cookie).rolling_token}`,
    },
    body: JSON.stringify(payload),
  });
};
