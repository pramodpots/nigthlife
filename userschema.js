'use strict';

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userDataSchema = new Schema({
    account: {
        username: String,
        id: String
    }
})


module.exports = mongoose.model('userData', userDataSchema);
