import apiConfig from "./config";

export const fetchApi = async (
  endpoint: string,
  method: string = "GET",
  body?: any
) => {
  const response = await fetch(`${apiConfig.host}${endpoint}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body
  }).catch(error => {
    throw error;
  });

  if (response.status >= 200 && response.status < 300) {
    const responseJson = await response.json().catch(() => {
      return Promise.reject(response);
    });

    return Promise.resolve(responseJson);
  } else {
    return Promise.reject(response);
  }
};
