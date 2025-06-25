const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Try to find the user by googleId
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      // Sincronizează avatarul și numele la fiecare login cu Google
      user.avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : user.avatar;
      user.firstName = profile.name && profile.name.givenName ? profile.name.givenName : user.firstName;
      user.lastName = profile.name && profile.name.familyName ? profile.name.familyName : user.lastName;
      await user.save();
      return done(null, user);
    } else {
      // If not found by googleId, try to find by email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // If user found by email, update their googleId and also sync name and avatar
        user.googleId = profile.id;
        user.avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : user.avatar;
        user.firstName = profile.name && profile.name.givenName ? profile.name.givenName : user.firstName;
        user.lastName = profile.name && profile.name.familyName ? profile.name.familyName : user.lastName;
        await user.save();
        return done(null, user);
      } else {
        // If user not found by either googleId or email, create a new one
        user = await User.create({
          googleId: profile.id,
          firstName: profile.name.givenName, // Use givenName for firstName
          lastName: profile.name.familyName, // Use familyName for lastName
          email: profile.emails[0].value,
          avatar: profile.photos[0].value,
          // Password is not required for Google users
        });
        return done(null, user);
      }
    }

  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
