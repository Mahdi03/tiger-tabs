const { adminSDK, firebaseDB, bucket } = require("./firebaseInit");

module.exports = {
    /**
     * 
     * @param {string} familyID Family ID string
     * @returns object
     */
    returnFamilyObject: async(familyID) => {
        var familySnapshot = await firebaseDB.collection("families").doc(familyID).get();
        if (familySnapshot.exists) {
            console.log(`Family data for ${familyID}: ${familySnapshot.data()}`);
            return (familySnapshot.data());
        } else {
            //The document doesn't exist, familyID is somehow wrong?? throw error
        }
    },
    addTaskToFamily: async(familyID, jsonTask) => {
        var addingTaskToFamilyResponse = await firebaseDB.collection("families").doc(familyID).update({
            "tasks": adminSDK.firestore.FieldValue.arrayUnion(jsonTask)
        });
        console.log(addingTaskToFamilyResponse);
    }
}