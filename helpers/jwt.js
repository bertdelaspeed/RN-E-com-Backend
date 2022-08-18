const { expressjwt: expressJwt } = require("express-jwt");

function authJwt() {
  const secret = process.env.JWT_SECRET;
  const api = process.env.API_URL;
  return expressJwt({
    secret: secret,
    algorithms: ["HS256"],
    // isRevoked: isRevoked,
  }).unless({
    path: [
      { url: /\/api\/v1\/products(.*)/, methods: ["*", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/, methods: ["*", "OPTIONS"] },
      { url: /\/api\/v1\/users(.*)/, methods: ["*", "OPTIONS"] },
      `${api}/users/login`,
      `${api}/users/register`,
      `${api}/users/reset-password`,
    ],
  });
}

async function isRevoked(req, token) {
  console.log("Token : ", token);
  if (!token.payload.isAdmin) {
    return true;
  }
}
// async function isRevoked(req, payload, done) {
//   if (!payload.isAdmin) {
//     return done(null, true);
//   }
//   done();
// }

module.exports = authJwt;

// exports.authJwt = expressJwt({
//   secret: process.env.JWT_SECRET,
//   algorithms: ["HS256"],
//   isRevoked: isRevoked,
// });
