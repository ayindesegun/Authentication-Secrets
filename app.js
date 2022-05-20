require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const { default: mongoose } = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth2').Strategy
const findOrCreate = require('mongoose-findorcreate')
const FacebookStrategy = require('passport-facebook').Strategy

const app = express()

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {},
  })
)
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect('mongodb://localhost:27017/userDB')
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String,
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy())

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  done(null, user)
})

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/secrets',
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      //console.log(profile)
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user)
      })
    }
  )
)
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/facebook/secrets',
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile)
      User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user)
      })
    }
  )
)
/* passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'https://locahost:3000/auth/google/secrets',
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile)
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user)
      })
    }
  )
) */

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

app.get(
  '/auth/facebook',
  passport.authenticate('facebook' /* ,{ scope:['profile'] } */)
)

app.get(
  '/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets')
  }
)

app.get(
  '/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets')
  }
)

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.get('/secrets', (req, res) => {
  User.find({ secrets: { $ne: null } }, (err, foundUsers) => {
    if (err) {
      console.log(err)
    } else {
      if (foundUsers) {
        res.render('secrets', { foundUsers: foundUsers })
      }
    }
  })
})

app.get('/submit', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('submit')
  } else {
    res.redirect('/login')
  }
})

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.post('/register', async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  User.register({ username: username }, password, function (err, user) {
    if (err) {
      console.log('Errors ' + err)
      res.redirect('/register')
    } else {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/secrets')
      })
    }
  })
})

app.post('/login', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  })
  req.login(user, (err) => {
    if (err) {
      console.log(err)
    } else {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/secrets')
      })
    }
  })
})

app.post('/submit', (req, res) => {
  const submittedSecrets = req.body.secret
  User.findById(req.user._id, (err, foundUser) => {
    if (err) {
      console.log(err)
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecrets
        foundUser.save(() => {
          res.redirect('/secrets')
        })
      }
    }
  })
})

app.listen(3000, () => {
  console.log('Server starting on port 3000')
})
