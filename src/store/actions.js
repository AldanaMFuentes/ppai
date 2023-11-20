import axios from "axios";

export default {
  async getCalls(context, payload) {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/llamadas?desde=${payload.desde}&hasta=${payload.hasta}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching calls:", error);
      throw error;
    }
  },
  async getCallById(context, payload) {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/llamadas/${payload}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching call by id:", error);
    }
  },
  async generateCsv(context, payload) {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/llamadas/${payload}/csv`,
        { responseType: "blob" }
      );
      return response;
    } catch (error) {
      console.error("Error fetching csv:", error);
    }
  },
};
