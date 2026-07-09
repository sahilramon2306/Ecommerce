import axiosInstance from "./axiosInstance";

// Public Contact Form
export const createContactMessage = async (data) => {
  return axiosInstance.post(
    "/contact",
    data,
    {
      skipAuth: true,
    }
  );
};

// Admin APIs

export const getAllContactMessages = async (
  page = 1,
  limit = 10
) => {
  return axiosInstance.get(
    `/contact-messages?page=${page}&limit=${limit}`
  );
};

export const getContactMessageById = async (
  id
) => {
  return axiosInstance.get(
    `/contact-messages/${id}`
  );
};

export const updateContactStatus = async (
  id,
  status
) => {
  return axiosInstance.put(
    `/contact-messages/${id}/status`,
    { status }
  );
};

export const deleteContactMessage = async (
  id
) => {
  return axiosInstance.delete(
    `/contact-messages/${id}`
  );
};