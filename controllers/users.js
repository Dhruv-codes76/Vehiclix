const User = require("../models/user");

module.exports.renderSignupForm =  (req,res)=>{
    res.render("users/signup.ejs");
}

module.exports.signup = async(req,res)=>{
    try{
    let {username, email, password} = req.body;
    const newUser = new User({email,username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err)=>{
        if(err) return next(err);
        req.flash("success", "user was successfully registered");
        res.redirect("/listings");
    })
    
    }
    catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}

module.exports.renderLoginForm = (req,res)=>{
    res.render("users/login.ejs");
}
module.exports.login = async (req,res) => {
    req.flash("success", "Welcome back!");
    let redirectUrl = req.session.redirectUrl || "/listings";
    res.redirect(redirectUrl);
}

module.exports.logout = (req,res)=>{
    req.logout((err) =>{
        if(err) {
           return next(err);
        }    
        req.flash("success", "Logged out successfully");
        res.redirect("/listings");
    })
}

module.exports.registerUser = async (req, res) => {
    try {
        console.log("Form data received:", req.body); // Debugging: Log the form data

        const { username, password, email, firstName, lastName, phoneNumber } = req.body;

        const newUser = new User({
            username,
            email,
            firstName,
            lastName,
            phoneNumber,
        });

        const registeredUser = await User.register(newUser, password);

        console.log("User registered:", registeredUser); // Debugging: Log the registered user

        req.flash("success", "Registration successful! Welcome to Vehiclix.");
        res.redirect("/login");
    } catch (err) {
        console.error("Error registering user:", err); // Debugging: Log the error
        req.flash("error", "Failed to register user. Please try again.");
        res.redirect("/register");
    }
};