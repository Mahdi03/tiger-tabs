module.exports = {
    /**
     * Function to generate random uppercase alphanumeric ID 
     * @param {number} length - The length of the randomly generated ID
     * @returns {string} - Pseudo-randomly generated ID
     */
    generateRandomID: (length) => {
        var result = "";
        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) { //Makes a pseudo-random ID of certain length
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    /**
     * Function for generating random string for session secret environmental variable
     * Usage `console.log(generateSecureString())`
     * @returns Hex String Encoding of Secret Random String
     */
    generateSecureString: () => {
        const crypto = require("crypto");
        return new Promise((resolve, reject) => {
            crypto.randomBytes(256, (error, buffer) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(buffer.toString("hex"));
                }
            });
        }).then((secureString) => { console.log(secureString); });
    },
    hashPassword: async(password) => {
        const bcrypt = require('bcrypt'); //used to hash passwords
        var salt = await bcrypt.genSalt(10); //Go through 10 layers of encryption
        var hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }
};