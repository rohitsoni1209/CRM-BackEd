const express = require("express");
const router = express.Router();
const facebook = require("../controller/platforms/facebookController");
const { auth } = require("../middlewares/auth");

// //console.log("Test");
// router.post("/facebook", facebook.create); //Done
// router.post("/facebook-access_token", facebook.access_token);
// router.get("/credentials/:name", facebook.GetAuthURLByName); //Done
// router.get("/auth_url1111", facebook.GetAuthURL); //Using credentials
// router.get("/facebook-single/:id", facebook.GetAuthURLByID);
// router.get("/credentials-list", facebook.GetAuthURLList);
// router.patch("/facebook/:id", facebook.updateFacebook);
// router.delete("/facebook/:id", facebook.DeleteFacebook);
// router.get("/facebook/business-account", facebook.Buessiness_Account_ids);
// router.post("/facebook/get_ads_data", facebook.Get_Account_Data);
// router.post("/facebook/get-creadtive-data", facebook.Get_Ads_Creadtive_Data);
// router.post("/facebook/get-adsets-data", facebook.Get_Adsets_Data);
// router.post("/facebook/get-ad-images", facebook.Get_Ad_Images);
// // router.post('/facebook/get-ad-insights', facebook.Get_Ad_Insights);
// router.post("/facebook/get_campaigns_data", facebook.Get_Campaigns_Data);
// // router.post("/facebook/get_ads_data", facebook.Get_Ads_Data);
router.use(auth);
module.exports = router;
