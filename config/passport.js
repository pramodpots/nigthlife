var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var configAuth = require('./auth');
var User = require("../userschema");

	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	passport.use(new TwitterStrategy({
		consumerKey: configAuth.facebookAuth.clientID,
		consumerSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL
	},
	function (token, refreshToken, profile, done) {
		//console.log(profile)
		process.nextTick(function () {
			User.findOne({ 'account.id': profile.id }, function (err, user) {
				if (err) {
					return done(err);
				}

				if (user) {
					return done(null, user);
				} else {
					var newUser = new User();
					newUser.account.username = profile.displayName;
					newUser.account.id = profile.id;

					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, newUser);
					});
				}
			});
		});
	}));

