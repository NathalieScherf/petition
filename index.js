const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const csurf = require("csurf");

const bcrypt = require("./bcrypt");

// handlebars-express: do not touch:
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// do not touch above!

//include bodyparser! req.body is the object it returns!
// left hand value will be name of input field, righthand side: text form input field

app.use(
    cookieSession({
        secret:
            process.env.SESSION_SECRET || require("./secrets").sessionSecret, // "I'm always angry." any string also in the encrypted cookie
        maxAge: 1000 * 60 * 60 * 24 * 14 //two weeks
    })
);
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
///security:
app.use(csurf());

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use(function(req, res, next) {
    res.setHeader("X-Frame-Options", "deny");
    next();
});

///end security
app.use(express.static("./public"));

app.get("/", (req, res) => {
    res.redirect("/register");
});
app.get("/register", (req, res) => {
    res.render("register", { layout: "main" });
});
app.post("/register", (req, res) => {
    bcrypt
        .hash(req.body.password)
        .then(function(hash) {
            return db.registerUser(
                req.body.first,
                req.body.last,
                req.body.email,
                hash
            );
        })
        .then(function(results) {
            req.session.firstName = req.body.first;
            req.session.lastName = req.body.last;
            req.session.userId = results[0].id;
        })
        .then(function() {
            res.redirect("/profile");
        })
        .catch(function(err) {
            console.log(err);
            res.render("register", { layout: "main", err });
        });
});

app.get("/login", (req, res) => {
    res.render("login", { layout: "main" });
});

app.post("/login", (req, res) => {
    //check if sig in present., set as cookie
    db.byEmail(req.body.email)
        .then(function(results) {
            return bcrypt
                .compare(req.body.pass, results[0].pass)

                .then(function(doesMatch) {
                    if (doesMatch) {
                        req.session.sigId = results[0].sig_id;
                        req.session.firstName = results[0].first;
                        req.session.lastName = results[0].last;
                        req.session.userId = results[0].id;
                        res.redirect("/petition");
                    }
                    if (!doesMatch) {
                        console.log("not loged in");
                        throw new Error();
                    }
                });
        })
        .catch(function(err) {
            console.log(err);
            res.render("login", { layout: "main", err });
        });
});

app.get("/profile", function(req, res) {
    res.render("profiles", { layout: "main" });
});
app.post("/profile", function(req, res) {
    newUrl = "";
    if (!req.body.url.startsWith("http://")) {
        newUrl = "http://" + req.body.url;
    }
    db.userProfile(req.body.age, req.body.city, newUrl, req.session.userId)
        .then(function(results) {
            console.log(results);
            res.redirect("/petition");
        })
        .catch(function(err) {
            console.log(err);
            res.render("profiles", { layout: "main", err });
        });
});
app.get("/profile/edit", function(req, res) {
    db.listProfileInfo(req.session.userId).then(function(results) {
        res.render("editprofile", { layout: "main", profileContent: results });
    });
});
app.post("/profile/edit", function(req, res) {
    let promises = [];
    if (req.body.password != "") {
        promises.push(
            bcrypt.hash(req.body.password).then(function(hash) {
                return db.updateProfileInfoPass(
                    req.session.userId,
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hash
                );
            })
        );
    } else {
        promises.push(
            db.updateProfileInfo(
                req.session.userId,
                req.body.first,
                req.body.last,
                req.body.email
            )
        );
    }
    promises.push(
        db.upsertUserProfiles(
            req.body.age,
            req.body.city,
            req.body.url,
            req.session.userId
        )
    );
    Promise.all(promises)
        .then(function(results) {
            console.log(results);
            res.redirect("/profile/edit");
        })
        .catch(function(err) {
            console.log(err);
            res.render("editprofile", { layout: "main", err });
        });
});
app.get("/petition", function(req, res) {
    if (req.session.sigId) {
        console.log("rediricted from petition");
        res.redirect("/thanks");
    } else {
        res.render("petition", { layout: "main" });
    }
});

app.post("/petition", function(req, res) {
    db.createSign(req.body.sig, req.session.userId)
        .then(function(results) {
            req.session.firstName = req.body.first;
            req.session.sigId = results[0].sig_id; //is from signatures table
        })
        .then(function() {
            res.redirect("/thanks");
        })
        .catch(function(err) {
            console.log(err);
            res.render("petition", { layout: "main", err });
        });
});

app.get("/thanks", (req, res) => {
    db.getSig(req.session.userId).then(function(results) {
        var signaturePic = results[0].sig;
        res.render("thanks", {
            layout: "main",
            name: req.session.firstName,
            sign: signaturePic
        });
    });
});

app.get("/logout", function(req, res) {
    req.session = null;

    res.render("logout", {
        layout: "main"
    });
    //res.redirect("/register");
});

// list all signers
app.get("/signers", (req, res) => {
    db.listSignature().then(function(results) {
        res.render("signersList", {
            layout: "main",
            list: results
        });
    });
});
//list signers of selected city:
app.get("/signers/:city", (req, res) => {
    db.listSignatureByCity(req.params.city).then(function(results) {
        res.render("signersList", {
            layout: "main",
            list: results
        });
    });
});

app.post("/sig/delete", function(req, res) {
    db.deleteSignature(req.session.userId)
        .then(function(results) {
            //change to .then(function(req,res){})
            req.session.sigId = null;
            res.redirect("/unsigned");
        })
        .catch(function(err) {
            console.log(err);
            res.render("thanks", { layout: "main", err });
        });
});
app.get("/unsigned", function(req, res) {
    res.render("unsigned", {
        layout: "main"
    });
});

app.post("/user/delete", function(req, res) {
    let promisesToDelete = [];
    if (req.session.sigId != "") {
        promisesToDelete.push(
            db.deleteSignature(req.session.userId).then(function(results) {
                console.log(results);
                req.session.sigId = null;
            })
        );
    }
    promisesToDelete.push(db.deleteUserProfile(req.session.userId));

    Promise.all(promisesToDelete)
        .then(db.deleteUser(req.session.userId))
        .then(function(results) {
            console.log(results);
            res.redirect("/deleted");
        })
        .catch(function(err) {
            console.log(err);
            res.render("/profile/edit", { layout: "main", err });
        });
});
app.get("/deleted", function(req, res) {
    res.render("deleted", { layout: "main" });
});

app.listen(process.env.PORT || 8080, () => console.log("Listening!"));
//port on heroku comes from process.env.PORT
//app.listen(process.env.PORT || 8080);
/*Part 4:
to deal with upper-lower case:
WHERE LOWER (city)= LOWER($1);
*/
