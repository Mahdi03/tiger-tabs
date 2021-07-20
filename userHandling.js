const { adminSDK, firebaseDB, bucket } = require("./firebaseInit");
const { hashPassword } = require("./tools");
const { format } = require('util');
module.exports = {
    /**
     * searchFirebase - Function to grab collection of families and compile familyIDs, emails, and usernames
     * @returns {Object} - Object with 3 arrays attached to them
     */
    searchFirebase: async() => {
        const listOfFamilyIDs = [];
        const listOfEmails = [];
        const listOfUsernames = [];
        var snapshot = await firebaseDB.collection("families").get(); //Gets entire database
        snapshot.forEach((family) => {
            listOfFamilyIDs.push(family.id);
            var familyObj = family.data();
            for (account of familyObj["accounts"]) {
                listOfUsernames.push(account["username"]);
                listOfEmails.push(account["email"]);
            }
        });
        return {
            listOfFamilyIDs: listOfFamilyIDs,
            listOfEmails: listOfEmails,
            listOfUsernames: listOfUsernames
        };
    },
    /**
     *
    Search Firebase DB for:
    - Username already exists ("I'm sorry but the username you were looking for has already been taken")
    - Email already exists ("There is already an email under this account, try logging in")
    - Family ID does not exist ("The family ID you entered was not correct")

    return JSON
    {
        username: {
            exists: alreadyExists,
            errMessage: ""
        },
        email: {
            exists: alreadyExists,
            errMessage: ""
        },
        familyID: {
            exists: alreadyExists,
            errMessage: ""
        }
    }
    From Firebase get array of:
            - usernames
            - emails
            - familyIDs
     * @param {string} username - User-inputted username
     * @param {string} email - User-inputted email
     * @param {string} familyID - User-inputted Alphanumeric 6 digit ID
     * @returns {object} 
     */
    makeSureAccountDoesNotExist: (username, email, familyID) => {
        return module.exports.searchFirebase().then((listObj) => {
            const returnObj = {};
            var error = 0;
            //Check if username exists
            if (listObj.listOfUsernames.includes(username)) {
                //Username already exists
                returnObj["usernameExists"] = true;
                error++;
            }
            //Check if email exists
            if (listObj.listOfEmails.includes(email)) {
                //Email already exists
                returnObj["emailExists"] = true;
                error++;
            }
            //Check if Family ID does not exist
            if (familyID !== "" && !listObj.listOfFamilyIDs.includes(familyID)) {
                //Family ID is provided and does not exist
                returnObj["familyIDExists"] = false;
                error++;
            }
            //If username does not exist, email does not exist, and family id exists, return JSON no errors, else return JSON with errors
            if (error === 0) {
                returnObj["success"] = true;
            }
            return returnObj;
        });
    },
    /**
     * This function creates object and stores it to Firebase Firestore DB after hashing password
     * @param {object} userObj Object with user data to store
     */
    createAccount: (userObj) => {
        /*
        var User = {
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
            parentOrChild: req.body.parentOrChild,
            familyID: req.body.familyID
        };
        */
        var cleanUser = {
            name: userObj.name,
            email: userObj.email,
            username: userObj.username, //The username is the unique identifier (UUID so to say??)
            hashedPassword: "",
            parentOrChild: userObj.parentOrChild,
            familyID: userObj.familyID,
            currentPoints: 0,
            totalPoints: 0,
            profilePic: ""
        };
        //Hash password for saving to database:
        hashPassword(userObj.password).then((hashedPassword) => {
                cleanUser["hashedPassword"] = hashedPassword;
            })
            //now add profile pic if not before

        //At this point the familyID is no longer blank, either a new one or a join one
        //https://stackoverflow.com/questions/46597327/difference-between-set-with-merge-true-and-update
        //Check if family exists yet
        .then(module.exports.searchFirebase).then(async(listObj) => {
            if (listObj.listOfFamilyIDs.includes(userObj.familyID)) {
                //Family ID found, add account to family
                var addingFamilyMemberToArrayResponse = await firebaseDB.collection("families").doc(userObj.familyID).update({
                    "accounts": adminSDK.firestore.FieldValue.arrayUnion(cleanUser)
                });
                //console.log(addingFamilyMemberToArrayResponse);
                console.log(addingFamilyMemberToArrayResponse);
            } else {
                //Family ID does not exist, create a new family
                var addingNewFamilyResponse = await firebaseDB.collection("families").doc(userObj.familyID).set({
                    accounts: [cleanUser],
                    notifications: [],
                    rewards: [],
                    tasks: []
                }, { merge: true });
                console.log(addingNewFamilyResponse);
            }
        }).then(() => {
            console.log("WELP we got here somehow!!"); //Success, the account was added
        }).catch((errors) => {
            console.error(errors);
        });
    },
    /**
     * https://sdusteric.medium.com/nodejs-with-firebase-storage-c6ddcf131ceb
     * The following function is a modified version of the above URL such that images are saved to the accounts as well
     * @param {string} familyID Uppercase Alphanumeric 6 digit family id
     * @param {string} username Unique account identifier (username?)
     * @param {file} imageFile File received from Multer in App.js
     * @returns {Promise} Returns the promise for more changing 
     */
    changePFP: (familyID, username, imageFile) => {
        return new Promise(async(resolve, reject) => {
            //Supply familyID to get doc w/ familyID then search thru accounts until find username
            //var settingPFPURL
            //Upload imgBuffer to google firebase cloud storage
            if (imageFile == undefined) {
                reject('No image file'); //There is no image file, replace with regular URL
            } else {
                let newFileName = `${imageFile.originalname}_${Date.now()}`;
                newFileName = "profilePic";

                let fileUpload = bucket.file(newFileName);

                const blobStream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: imageFile.mimetype
                    }
                });

                blobStream.on('error', (error) => {
                    reject('Something is wrong! Unable to upload at the moment.');
                });

                blobStream.on('finish', () => {
                    // The public URL can be used to directly access the file via HTTP.
                    const url = format(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
                    resolve(url);
                });

                blobStream.end(imageFile.buffer);
            }

        });

        /** 
         * Upload the image file to Google Storage
         * @param {File} file object that will be uploaded to Google Storage
         */
    },
    /**
     * Async Function to search through Firebase Database until it finds a user match and returns the user information
     * @param {string} username - Search with the user-inputted username
     * @param {string} hashedPassword - Cross-check with the bcrypt hashed password
     */
    searchFirestoreLoginCredentials: async(username, hashedPassword) => {
        var snapshot = await firebaseDB.collection("families").get(); //Gets entire database
        //In order to avoid a forEach loop (we should be able to break the loop as soon as the user is found) use try-catch statement with
        try {
            snapshot.forEach((family) => {
                var familyObj = family.data();
                for (account of familyObj["accounts"]) {
                    //Check if username matches
                    if (account.username === username && account.hashedPassword === hashedPassword) {
                        //Ooh user match!! Collect user information and exit nested loop
                        throw BreakException;
                    }
                }
                //If we are still here that means no BreakException was thrown, and user not found, or password was wrong!!
                //throw error or return falsy value
            });
        } catch (e) {
            if (e !== BreakException) {
                throw e;
            }
        }
        //Now return user information
    }
}