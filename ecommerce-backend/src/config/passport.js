const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const userModel = require("../model/user"); // Adjust path if needed

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google account email not found"), null);
        }

        // Find existing user
        let user = await userModel.findOne({ email });

        // Create user if not exists
        if (!user) {
          user = await userModel.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            isVerified: true,
          });
        }

        // IMPORTANT: Use MongoDB _id in JWT
        const token = jwt.sign(
          {
            id: user._id,
            email: user.email,
            name: user.name,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

        return done(null, {
          token,
          user,
        });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;