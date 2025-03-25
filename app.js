const express = require("express");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const path = require("path");
const ExpressError = require("./utils/ExpressError");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoose = require("mongoose");
const session = require("express-session");
const userRoute = require("./routes/user");
const courseRoute=require("./routes/course");
const bodyParser = require("body-parser");
const course = require("./models/course");
const axios=require("axios");

require("dotenv").config();

mongoose.connect(process.env.ATLAS_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Database Connected!'));

const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

const app = express();
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(flash());
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(express.json());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/home");
});


app.use("/", userRoute);
app.use("/",courseRoute);

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ reply: 'Please provide a message!' });
    }

    try {
        const apiKey = process.env.API_KEY;
        const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

        const response = await axios.post(
            `${geminiEndpoint}?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: userMessage }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

       
        console.log('Full API Response:', JSON.stringify(response.data, null, 2));

       
        const botReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
        
        res.json({ reply: botReply });

    } catch (error) {
        console.error('Error with Gemini API:', error.response ? error.response.data : error.message);
        res.status(500).json({ reply: 'Sorry, I couldn’t process your request right now!' });
    }
});


app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});


app.all("*", (req, res, next) => {
    next(new ExpressError(404, "This Route Doesn't Exist"));
});


app.listen(3000, () => {
    console.log("App is listening on port 3000");
});
