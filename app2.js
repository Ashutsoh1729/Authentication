const express = require("express")
const app = express()
const ejs = require("ejs")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const session = require("express-session")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy;
app.use(express.urlencoded({ extended: false }))  //Not using bodyParser, using Express in-built body parser instead
app.set("view engine", "ejs")
app.use(express.static("public"))

app.use(session({
    secret: "Justarandomstring.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB")
const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

const User = new mongoose.model("User", userSchema)

//Creating Local Strategy. passport-local-mongoose 3 lines of code for Strategy, 
//Serialiazation, Deserialization not working due to recent changes in Mongoose 7
passport.use(new LocalStrategy((username, password, done) => {  //done is a callback function
    try {
        User.findOne({ username: username }).then(user => {
            if (!user) {
                return done(null, false, { message: "Incorrect Username" })
            }
            //using bcrypt to encrypt passoword in register post route and compare function in login post round. 
            //login post route will check here during authentication so need to use compare here  
            bcrypt.compare(password, user.password, function (err, result) {
                if (err) {
                    return done(err)
                }

                if (result) {
                    return done(null, user)
                }
                else {
                    return done(null, false, { message: "Incorrect Password" })
                }
            })

        })
    }
    catch (err) {
        return done(err)
    }

}))
//serialize user
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

//deserialize user  
passport.deserializeUser(function (id, done) {
    console.log("Deserializing User")
    try {
        User.findById(id).then(user => {
            done(null, user);
        })
    }
    catch (err) {
        done(err);
    }
});


//get routes
app.get("/", function (req, res) {
    res.render("home")
})

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/register", function (req, res) {
    res.render("register")
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets")
    }
    else {
        res.redirect("/login")
    }
})

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err)
        }
        res.redirect("/");
    });

})

//post routes
app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, 10, function (err, hash) {  //10 is SaltRounds
        if (err) {
            console.log(err)
        }
        const user = new User({
            username: req.body.username,
            password: hash
        })
        user.save()

        passport.authenticate('local')(req, res, () => { res.redirect("/secrets") })
    })
})



app.post('/login', passport.authenticate('local', { successRedirect: "/secrets", failureRedirect: '/login' }));

//listen
app.listen(3000, () => {
    console.log("Server Running on Port 3000")
})