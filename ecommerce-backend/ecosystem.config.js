module.exports = {
  apps: [
    {
      name: "ecommerce-backend-5000",
      script: "./app.js",
      env: {
        PORT: 5000,
      },
    },
    {
      name: "ecommerce-backend-5001",
      script: "./app.js",
      env: {
        PORT: 5001,
      },
    },
    {
      name: "ecommerce-backend-5002",
      script: "./app.js",
      env: {
        PORT: 5002,
      },
    },
  ],
};