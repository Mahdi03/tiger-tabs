const { firebaseDB } = require("./firebaseInit");






const { generateRandomID, generateSecureString } = require("./tools");
const { searchFirebase, makeSureAccountDoesNotExist, searchFirestoreLoginCredentials, createAccount } = require("./userHandling");
const { startUserSession } = require("./sessionHandling");

const express = require('express'); //npm install express
const PORT = process.env.PORT || 5000;
const path = require("path");
const bcrypt = require('bcrypt'); //used to hash passwords
const app = express();
//npm install ejs
app.engine('html', require('ejs').renderFile); //Used to render HTML - npm install html
app.engine('css', require('ejs').renderFile); //Used to render CSS - npm install css
app.use(express.static(path.join(__dirname, 'public'))); //Used to find "public" folder outside of folder of this script and serve CSS/JS files
app.use(
    express.urlencoded({
        extended: true
    })
);
const session = require("express-session");
const FirestoreStore = require("firestore-store")(session);
app.use(
    session({
        store: new FirestoreStore({
            database: firebaseDB,
        }),
        secret: [process.env.SESSION_SECRET1],
        resave: false,
        saveUninitialized: true,
    })
)
app.listen(PORT, () => {
    console.log(`Success, listening on port: ${PORT}`);
});


/**
 * Sign in lock, make sure the user is signed in, if not then redirect them to the proper page
 */
function pageLock(res, redirTo) {
    //If they are logged in then display the page
    if (true) {
        res.render(path.join(__dirname, 'public', redirTo));
    }
    //Else Show Login Page
    else {
        res.render(path.join(__dirname, '/public/register.html'));
    }
}
/********************************************* GET Requests/Page Loads **************************************************/
app.get('/dashboard', (req, res) => {
    pageLock(res, 'dashboard.html');
});
app.get('/leaderboard', (req, res) => {
    pageLock(res, 'leaderboard.html');
});
app.get('/notifications', (req, res) => {
    pageLock(res, 'notifications.html');
});
app.get('/register', (req, res) => {
    pageLock(res, 'dashboard.html');
});
//Entry point
app.get('/', (req, res) => {
    //Redirect to Landing page with video
    res.render(path.join(__dirname, 'public', 'register.html'));
});
/**************************************** POST Requests/(Form/Data) Submissions ********************************************/
function checkChildOrParent() {
    return true ? 'child' : 'parent';
}
app.post("/login", async(req, res) => {
    //console.log(req);
    var username = req.body.username;
    var password = req.body.password;
    hashPassword(password).then((hashedPassword) => {
        console.log(`Username: ${username}\nHashed Password: ${hashedPassword}`);
        //Search DB for username exists
        //If username not found: throw new Error("Sorry but the username was not found"), res.doNothing
        //If exists, check password
        if (true) {
            if (true) {
                //Password checks out, store user session and redir to dashboard
                res.redirect(200, "dashboard");
                //res.render(__dirname + '/../public/' + 'dashboard.html');
            } else {
                throw new Error("I'm sorry but the password you entered is incorrect");
            }
        }
        //If not, return error
        else {
            throw new Error("I'm sorry but the username was not found");
        }
        //If failed: return with error message on page

    });
});
const Multer = require("multer");
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 //no larger than 5mb
    }
})
app.post("/register", multer.single("pfp"), (req, res) => {
    console.log(req.body);
    /*
        req.body = 
        {
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        parentOrChild: 'parent',
        familyID: ''
        }
    */
    //console.log(req.file);
    var User = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        parentOrChild: req.body.parentOrChild,
        familyID: req.body.familyID
    };
    //Promise.resolve("Begin") starts a Promise chain with an already resolved promise
    Promise.resolve("Begin").then(() => {
            //Validate if password and confirm password are the same
            if (User.password !== User.confirmPassword) {
                //Fail, throw error and return alert("The passwords you entered do not match");
                throw new Error("The passwords you entered do not match");
            }
        }).then(async() => {
            //Validate if email or username already exists in database
            return makeSureAccountDoesNotExist(User.username, User.email, User.familyID);
        })
        .then((listObj) => {
            if (!listObj.hasOwnProperty("success")) {
                //Ok well it did not work - either email/username already exists or familyID does not exist
                //console.log("hello");
                var errorString = "";
                if (listObj.hasOwnProperty("usernameExists")) { errorString += "It seems this username already exists\n"; }
                if (listObj.hasOwnProperty("emailExists")) { errorString += "It seems this email has already been used\n"; }
                if (listObj.hasOwnProperty("familyIDExists") && Boolean(listObj["familyIDExists"]) == false) { errorString += "The Family ID you requested was not found\n"; }

                throw new Error(errorString);
            }
        }).then(() => {
            //Family IDs
            //Store all family IDs into an array to search thru
            var familyIDsArray = []; //Fill this array with family IDs from firebase
            searchFirebase().then((listObj) => { familyIDsArray = listObj.listOfFamilyIDs; });
            //If child:
            if (User.parentOrChild === "child") {
                if (User.familyID === "") {
                    //Family ID was not provided, go back and provide Family ID to join
                    throw new Error("Child accounts must provide a Family ID to join");
                } else if (!familyIDsArray.includes(User.familyID)) {
                    //Family ID was not found, go back and provide correct Family ID to join
                    throw new Error("The Family ID you requested was not found");
                } else if (familyIDsArray.includes(User.familyID)) {
                    //Family ID found, join this family
                } else {
                    //Uh oh something went wrong, return error
                    throw new Error("Uh what...how did we get here this isn't even possible");
                }
            }
            //If parent:
            else if (User.parentOrChild === "parent") {
                //If family ID given, validate if family does not exist
                if (User.familyID === "") {
                    //Family ID was not provided, make new Family ID and check to see if it exists in DB until new unique one found
                    function checkFamilyID() {
                        var tempFamilyID = generateRandomID(6);
                        if (familyIDsArray.includes(tempFamilyID)) {
                            checkFamilyID();
                        } else {
                            User.familyID = tempFamilyID;
                        }
                    }
                    //new Promise(checkFamilyID()).then()
                    checkFamilyID();
                    //Now join this family with familyID - make function in userHandling.js

                } else if (!familyIDsArray.includes(User.familyID)) {
                    //Family ID was not found, go back and provide correct Family ID to join
                    throw new Error("The Family ID you requested was not found");
                } else if (familyIDsArray.includes(User.familyID)) {
                    //Family ID found, join this family
                } else {
                    //Uh oh something went wrong, return error
                    throw new Error("Uh what...how did we get here this isn't even possible");
                }
            }
            //If we are still here that means no errors thrown, we can make the account
            //If all that works then good to go register
            //Add user info to database
            createAccount(User);
            //Add file - use separate function to change PFP so that users can change PFP later
            /*
            var file = req.file;
            if (file) {
                uploadImageToStorage(file).then((success) => {
                    res.status(200).send({
                        status: 'success'
                    });
                }).catch((error) => {
                    console.error(error);
                });
            }
            else {
                //You opted not to have a profile picture, so the default has been assigned to you
            }*/
        })
        .then(() => {
            //Redirect to dashboard
        })
        .catch((err) => {
            //throw err;
            //We shouldn't be here, some part of the registration process went bad, redirect to login page?
            console.error(e.message);

        });
    /*
    } catch (e) {
        //We shouldn't be here, some part of the registration process went bad, redirect to login page?
        console.error(e.message);

    }*/


});

app.post('/register.html', async(req, res) => {
    //Get user data
    //Set authentication and begin logged in session?
    /**
     * Hash passwords using bcrypt?
     */
    //If Login:
    //Get data
    var formType = req.body.formType;
    console.log(req.body);
    if (formType === "login") {
        //console.log(req);
        var username = req.body.username;
        console.log('Username: ' + username);
        //var password = req.body.password;
        var salt = await bcrypt.genSalt(10);
        var hashedPassword = await bcrypt.hash(req.body.password, salt);
        console.log(hashedPassword);
        //Search DB for username
        //If exists, check password
        if (true) {
            if (hashedPassword) {
                //Password checks out, store user session and redir to dashboard
                res.redirect(200, "dashboard");
                //res.render(__dirname + '/../public/' + 'dashboard.html');
            } else {
                throw new Error("I'm sorry but the password you entered is incorrect");
            }
        }
        //If not, return error
        else {
            throw new Error("I'm sorry but the username was not found");
        }
        //If failed: return with error message on page
    }
    //If Register:
    else if (formType === "register") {
        console.log(req.body);
    } else {
        //Welp we shouldn't be here, something DEFINITELY went wrong!
        console.log("tf?");
    }
    //Validate data on backend
    //res.send('Login/Register Attempt'); //Practice purposes
    //res.send(req.body);
});
app.get("/sign-out", (req, res) => {
    //Use express sessions here and destroy session before redir to landing page
});

//RESTful API Endpoints
//For Register Page
app.get("/check-registration", async(req, res) => {
    console.log(req);
    //Check if the request was made with XMLHttpRequest: The user should not be trying to navigate to this page as it does not exist, redirect them elsewhere
    if (req.header("XMLHttpRequest") === "true") {
        console.log("Successful GET request to /check-registration");
        var username = req.query.username;
        var email = req.query.email;
        //var parentOrChild = req.query.parentOrChild;
        var familyID = req.query.familyID;

        /*
        
        */
        makeSureAccountDoesNotExist(username, email, familyID).then((listObj) => {
            res.status(200).json(listObj);
        });
        //res.status(200).json(makeSureAccountDoesNotExist(username, email, familyID));
    }
    //Redirect them elsewhere for trying to access an API endpoint
    else {
        res.redirect("/");
    }
});
//For Dashboard
app.get("/");
//To fetch notifications
app.get("/fetch-notifications");
/*
app.post("/check-registration", (req, res) => {});
app.get("/check-username", (req, res) => {
    //The user should not be trying to navigate to this page as it does not exist, redirect them elsewhere
});
app.post("/check-username", (req, res) => {
    //Search Firebase DB username, return whether username exists
});
app.get("/check-email", (req, res) => {
    //The user should not be trying to navigate to this page as it does not exist, redirect them elsewhere
});
app.post("/check-email", (req, res) => {
    //Search Firebase DB email, return whether email exists
});
app.get("/check-familyID", (req, res) => {
    //The user should not be trying to navigate to this page as it does not exist, redirect them elsewhere
});
app.post("/check-familyID", (req, res) => {
    //Search Firebase DB familyID, return whether familyID exists
});
*/