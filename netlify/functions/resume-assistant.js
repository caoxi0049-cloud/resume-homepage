const resumeAssistantHandler = require("../../api/resume-assistant.js");

exports.handler = async function handler(event) {
  return new Promise((resolve) => {
    const headers = {};
    const request = {
      method: event.httpMethod,
      body: event.body || "{}",
    };

    const response = {
      statusCode: 200,
      setHeader(name, value) {
        headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({
          statusCode: this.statusCode,
          headers: {
            ...headers,
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(payload),
        });
      },
      end() {
        resolve({
          statusCode: this.statusCode,
          headers,
          body: "",
        });
      },
    };

    Promise.resolve(resumeAssistantHandler(request, response)).catch((error) => {
      resolve({
        statusCode: 500,
        headers: {
          ...headers,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          error: "Resume assistant failed",
          detail: error.message,
        }),
      });
    });
  });
};
