//jshint esversion:6

require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const slatRound = 12;


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
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema)    // Define a Mongoose model called "User" using the userSchema

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// Here it ends



app.get("/", function (req, res) {
    res.render('home')
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets")
    } else {
        res.redirect("/login");
    }
})

app.route("/login")
    .get(function (req, res) {
        res.render('login')
    })
    .post(function (req, res) {

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








app.listen(3000, function () {
    console.log("Server has started at port 3000.");
})


