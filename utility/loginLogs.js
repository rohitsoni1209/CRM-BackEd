const { InsertOne } = require("../library/methods");

const loginLog = (LogPayload) => {
  return new Promise(async (resolve, reject) => {
    const { userInfo, clientIp, userAgent, organizationId } = LogPayload;
    // //console.log(clientIp)
    let clientIpAddress = null;
    if (clientIp.startsWith("::ffff:")) {
      clientIpAddress = clientIp.slice(7);
    }
    await InsertOne("loginLog", {
      user_Browser: userAgent,
      clientIp: clientIpAddress,
      userId: userInfo._id,
      organizationId: userInfo.organizationId,
      createdTime: new Date(),
      updatedTime: new Date(),
    });
    resolve();
  });
};

module.exports = {
  loginLog,
};
