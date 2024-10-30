const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const uploadFile = (file, organizationId) => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `DATA_${organizationId}.json`,
    Body: file
  };
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        // console.error('Error uploading file:', err);
        reject(err);
      } else {
        // //console.log('File uploaded successfully');
        resolve(data.Location);
      }
    });
  });
};


module.exports = {
  uploadFile
}