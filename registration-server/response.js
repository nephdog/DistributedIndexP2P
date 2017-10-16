module.exports = {
  error: (code, message) => {
    return JSON.stringify({
      success: false,
      error: {
        code,
        message
      }
    });
  },

  success: (data) => {
    return JSON.stringify({
      success: true,
      data
    });
  }
}
