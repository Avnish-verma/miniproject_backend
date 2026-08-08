const express= require('express');
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();
app.use(express.json());

app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const db=require('./mongooseConnection');
const registerRouter = require("./routes/registerRouter");
const loginRouter = require("./routes/loginRouter");
const protect = require("./controller/protect");
const profileRouter = require("./routes/profileRouter");



app.use("/register",registerRouter);
app.use("/login",loginRouter)
app.get("/test",protect,(req,res)=>{
    res.json({message:"welcome"});
})
app.use("/profile",protect,profileRouter)

app.use("/upload",protect,require("./controller/upload"));

app.listen(process.env.PORT,()=>{
    console.log("server is running on port " + process.env.PORT);
})