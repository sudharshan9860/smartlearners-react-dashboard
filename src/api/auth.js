import axiosInstance, { setTokens, clearTokens } from "./axiosInstance";

export const authAPI = {
  /**
   * Login user
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{access: string, refresh: string}>}
   */
  async login(username, password) {
    const response = await axiosInstance.post("/api/token/", {
      username,
      password,
    });

    const { access, refresh } = response.data;
    setTokens(access, refresh);

    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      const { refreshToken } = await import("./axiosInstance").then((m) =>
        m.getTokens(),
      );
      if (refreshToken) {
        await axiosInstance.post("/api/logout/", {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearTokens();
    }
  },

  /**
   * Verify token
   * @returns {Promise<boolean>}
   */
  async verifyToken() {
    try {
      await axiosInstance.get("/api/token/verify/");
      return true;
    } catch (error) {
      return false;
    }
  },
};
