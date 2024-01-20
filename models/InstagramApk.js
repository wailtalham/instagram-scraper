const mongoose = require('mongoose');

const InstagramApkSchema = new mongoose.Schema({
    version: String,
    releaseDate: String,
    variants: [{
        variantId: String,
        architecture: String,
        minAndroidVersion: String,
        dpi: String
    }]
});

module.exports = mongoose.model('InstagramApk', InstagramApkSchema);
