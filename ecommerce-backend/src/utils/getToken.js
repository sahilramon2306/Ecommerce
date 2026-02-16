const getToken = (req) => {
  // Read token from cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Optional fallback for Postman
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

module.exports = { getToken };
