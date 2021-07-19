const express = require('express'); //npm install express
const PORT = process.env.PORT || 5000;
const path = require("path");
const bcrypt = require('bcrypt'); //used to hash passwords
const app = express();
//npm install ejs
app.engine('html', require('ejs').renderFile); //Used to render HTML - npm install html
app.engine('css', require('ejs').renderFile); //Used to render CSS - npm install css
app.use(express.static(__dirname + '/public')); //Used to find "public" folder outside of folder of this script and serve CSS/JS files

app.use(
    express.urlencoded({
        extended: true
    })
);
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
var hashPassword = async(password) => {
    var salt = await bcrypt.genSalt(10); //Go through 10 layers of encryption
    var hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}
app.post("/login", async(req, res) => {
    //console.log(req);
    var username = req.body.username;
    var password = req.body.password;
    hashPassword(password).then((hashedPassword) => {
        console.log(`Username: ${username}\nHashed Password: ${hashedPassword}`);
        //Search DB for username
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

app.post("/register", (req, res) => {
    console.log(req.body);
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