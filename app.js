//jshint esversion:6

require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")


const app = express()
app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: "Our Little Secrets.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session())

// Below is the database connecting module with the user data schema

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })  // Connecting to MongoDB server usign mongoose

const userSchema = new mongoose.Schema({  // Declaring it as a fully mongoose schema, not as a Javascript object
    email: String,
    password: String,
    googleId: String,
    secrets: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema)    // Define a Mongoose model called "User" using the userSchema

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETS,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        //console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {  //=> Here find or create is not a actual code.You need to Create a new function to find or create the user in the database. I have downloaded a package to do this task 
            return cb(err, user);
        });
    }
));
// Here it ends



app.get("/", function (req, res) {
    res.render('home')
})


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        //console.log(req);
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


app.get("/secrets", function (req, res) {
    User.find({ "secrets": { $ne: null } }, function (err, findUser) {
        if (err) { console.log(err); } else {
            res.render("secrets", { "usersWithSecrets": findUser })
        }
    })
})

app.route("/login")
    .get(function (req, res) {
        res.render('login')
    })
    .post(passport.authenticate('local', {
        successRedirect: '/secrets',
        failureRedirect: '/login',

    }), function (req, res) {


    })

app.route("/register")
    .get(function (req, res) {
        res.render('register')
    })
    .post(function (req, res) {
        User.register({ username: req.body.username }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register")
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                })
            }
        })

    })


app.get("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect("/")
    })

})

app.route("/submit").get(function (req, res) {
    res.render("submit")
}).post(function (req, res) {
    //console.log(req.user);
    //console.log(req.body)
    let submittedSecret = req.body.secret

    User.findById(req.user.id, function (err, foundUser) {
        if (err) { console.log(err); }
        else {
            foundUser.secrets = submittedSecret;
            foundUser.save(function () {
                res.redirect("/secrets")
            })

        }
    })
})





app.listen(3000, function () {
    console.log("Server has started at port 3000.");
})


