require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/userDB');
    console.log('MONGO connected')
}

const User = require('./models/users')

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', (req, res) => {
    const user = new User({
        email: req.body.username,
        password: req.body.password
    })
    user.save((err) => {
        if (err) {
            console.log(err)
        } else {
            res.render('secrets')
        }
    });
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    User.findOne({ email: username }, function (err, foundUser) {
        if (err) {
            console.log(err)
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render('secrets')
                }
            }
        }
    })
})

app.listen(3000, () => {
    console.log('LISTENING ON PORT 3000')
})

