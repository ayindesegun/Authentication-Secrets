require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const { default: mongoose } = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const app = express()

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
  }))
  app.use(passport.initialize());
  app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB')
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema)
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.post('/register', (req, res) => {
  
})
app.post('/login', (req, res) => {
 
})
app.get('/logout', (req, res) => {
  res.redirect('/')
})

app.listen(3000, () => {
  console.log('Server starting on port 3000')
})
