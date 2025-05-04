if(process.env.Node_ !== "production"){
  require("dotenv").config();
}

require("dotenv").config();
// console.log(process.env.SECRET)

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js")
const session = require("express-session")
const MongoDBStore = require("connect-mongo");
const flash = require("connect-flash")
const passport = require("passport")
const LocalStrategy = require("passport-local")
const User = require("./models/user.js")

const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")
const homeRoutes = require("./routes/home.js")
const adminRoutes = require("./routes/admin");
const { isLoggedIn } = require("./middleware.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/vehiclix";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"public")))

const store = MongoDBStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
})

store.on("error", () => {
  console.log("session store error", err);
});

const sessionOptions = {
  store,
  secret : process.env.SECRET,
  resave : false,
  saveUninitialized: true,
  cookie : {
    expires: Date.now() + 7*24*60*60*1000,
    maxAge:  7*24*60*60*1000,
    httpOnly: true,
  }
};

// app.get("/", (req, res) => {
//   res.send("I am root");
// });



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser=req.user;
  next();
})

// app.get("/demouser", async (req,res) => {
//   let fakeUser = new User({
//     email: "student@gmail.com",
//     username : "delta-student"
//   });

//   let registeredUser = await User.register(fakeUser, "helloworld")
//   res.send(registeredUser)
// })

//superadmin

// app.get("/make-superadmin", async (req, res) => {
//   try {
//       // Check if the superadmin already exists
//       const superadmin = await User.findOne({ email: "superadmin@example.com" });
      
//       if (superadmin) {
//           return res.send("Superadmin already exists.");
//       }

//       // Create a new superadmin user
//       const superadminUser = new User({
//           email: "superadmin@example.com",
//           username: "superadmin", // Required by passport-local-mongoose
//           role: "superadmin"
//       });

//       // Register the superadmin user with a password
//       await User.register(superadminUser, "superadminpassword");

//       res.send("Superadmin created successfully.");
//   } catch (err) {
//       console.error(err);
//       res.status(500).send("Error creating superadmin: " + err.message);
//   }
// });


app.use("/", homeRoutes);
app.use("/listings", listingRouter)
app.use("/listings/:id/reviews", reviewRouter)
app.use("/", userRouter)
app.use("/admin", adminRoutes);

//Page Not Found
app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page Not Found"));
})

//Error Handling
app.use((err,req,res,next)=>{
  let {statusCode=500,message="Something Went Wrong"}=err;
  res.status(statusCode).render("error.ejs", {message})
  //res.status(statusCode).send(message);
})

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
