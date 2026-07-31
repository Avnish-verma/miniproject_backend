const express = require("express");
const mongoose = require("mongoose");


mongoose.connect(process.env.URI).then(()=>{
    console.log("connected");

})
.catch((err)=>{
    console.log(err)
});

module.exports = mongoose.connection;