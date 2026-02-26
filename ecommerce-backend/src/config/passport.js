const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userPayload = {
          id: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        };

        const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        return done(null, { token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;