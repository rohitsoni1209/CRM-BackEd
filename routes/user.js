const express = require("express");
const router = express.Router();
const Registration = require("../controller/authentication/registration");
const cityData = require("../controller/profile/cityController");
const Profile = require("../controller/profile/profileController");
const role = require("../controller/profile/role");
const permissionProfile = require("../controller/profile/permissionProfileController");
const leadApi = require("../controller/leads/leadApiController");
const usersController = require("../controller/users/usersController");
const UserLock = require("../middlewares/account-lock-email");
const IPLock = require("../middlewares/account-lock-ip");
const Login = require("../controller/authentication/login");
const stickyNote = require("../controller/profile/stickyNoteController");
const { googleAuthTokenVerify } = require("../helpers/gmail");
const { auth } = require("../middlewares/auth");

const dummyApi = require("../controller/DummyApi/dummyApi");

router.post("/add-dummy-data", dummyApi.AddDummyData);
router.post("/register/email", Registration.registerWithEmailAndPassword);

router.post("/register/registeremail", Registration.registerWithEmail);
//direrect register
router.post("/register/registerspemail", Registration.registerSPWithEmail);
//direrect register
router.post("/register/registeruser", Registration.registerUser);

router.post("/email-verify", Registration.emailVerify);
router.post("/otp-verify", Registration.OtpVerify);
router.post("/otp-resend", Registration.otpReSend);
router.post("/resend-email", Registration.resendEmailVerification);
router.post("/forgot-password", Registration.forgotPasswordLink);
router.post("/reset-password", Registration.resetPassword);
router.post("/login", Login.login);
router.post("/direct-login", Login.directLogin);
router.post("/insert-lead", leadApi.createLeads);

router.get("/get-all-city", cityData.getAllcity);

// router.post('/register/google',  googleAuthTokenVerify, Registration.registerWithGoogle);

router.use(auth);
router.post("/token", Login.refreshToken);
router.get("/profile", Profile.getUserProfile);
router.post("/add-profile-img", Profile.addProfilePicture);

router.get("/profile/:id", Profile.getUserProfileById);
router.patch("/profile", Profile.updateUserProfile);
router.post("/change-password", Profile.changePassword);
router.post("/role", role.createRoles);
router.get("/role", role.getRoles);
router.patch("/role", role.updateRoles);
router.get("/get-role-byid/:id", role.getRoleById);

router.get("/get-user", usersController.getUserList);
router.get("/get-user-byid/:id", usersController.getUserById);
router.post("/create-user", usersController.createUser);
router.patch("/update-user/:id", usersController.updateUsers);
router.patch("/active-user/:id", usersController.ActiveInactiveUsers);
router.patch("/active-inactive-user", usersController.BulkActiveInactiveUsers);

router.post("/sticky-note", stickyNote.createSticky);
router.get("/sticky-note", stickyNote.getSticky);
router.delete("/sticky-note/:stickyId", stickyNote.deleteSticky);
router.patch("/sticky-note", stickyNote.updateSticky);

router.post("/permission-profile", permissionProfile.createProfile);
router.get("/permission-profile", permissionProfile.getProfile);
router.patch("/permission-profile", permissionProfile.updateProfile);
router.get(
  "/get-permission-profile-byid/:id",
  permissionProfile.getProfileById
);

//Facebook Controller================================Starts

router.post("/facebook", Login.create); //Done
router.post("/facebook-access_token", Login.access_token);
router.get("/credentials/:name", Login.GetAuthURLByName); //Done
router.get("/auth_url", Login.GetAuthURL); //Using credentials
router.get("/facebook-single/:id", Login.GetAuthURLByID);
router.get("/credentials-list", Login.GetAuthURLList);
router.patch("/facebook/:id", Login.updateFacebook);
router.delete("/facebook/:id", Login.DeleteFacebook);
router.get("/facebook/business-account", Login.Buessiness_Account_ids);
router.post("/facebook/get_ads_data", Login.Get_Account_Data);
router.post("/facebook/get-creadtive-data", Login.Get_Ads_Creadtive_Data);
router.post("/facebook/get-adsets-data", Login.Get_Adsets_Data);
router.post("/facebook/get-ad-images", Login.Get_Ad_Images);
// router.post('/facebook/get-ad-insights', facebook.Get_Ad_Insights);
router.post("/facebook/get_campaigns_data", Login.Get_Campaigns_Data);
router.post("/facebook/get_leads_data", Login.Get_Leads_Data_By_Ads);
router.post("/facebook/get_specific_adsets_id", Login.Get_SpecificAdSetsID);
//Facebook Controller================================ENDS

module.exports = router;
