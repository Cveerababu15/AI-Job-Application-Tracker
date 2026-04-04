import API from "./api";

export const addJob = (data) => API.post("/jobs/add", data);
export const getJobs = () => API.get("/jobs/all");
export const updateJob = (id, data) => API.put(`/jobs/update/${id}`, data);
export const deleteJob = (id) => API.delete(`/jobs/delete/${id}`);