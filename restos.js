'use strict';

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var restoSchema = new Schema({
    resto_id: {
        type: Number,
        required: true
    },
    customers: [],
    totalGoing: Number

})


module.exports = mongoose.model('restoSchema', restoSchema);
