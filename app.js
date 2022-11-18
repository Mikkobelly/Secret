require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('./models/users')

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'Thisisourlittlesecret',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/userDB');
    console.log('MONGO connected')
}

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
)

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/secrets');
    });

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        User.find({ 'secret': { $ne: null } }, (err, foundUsers) => {
            if (err) {
                console.log(err)
            } else {
                if (foundUsers) {
                    res.render('secrets', { foundUsers })
                }
            }
        })
    } else {
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err)
        }
    });
    res.redirect('/')
})

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})

app.post('/register', (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    })
})

app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    })
})

app.post('/submit', (req, res) => {
    const { secret } = req.body;
    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err)
        } else {
            foundUser.secret = secret;
            foundUser.save(() => {
                res.redirect('/secrets')
            })
        }
    })
})


app.listen(3000, () => {
    console.log('LISTENING ON PORT 3000')
})

