const express= require('express');
const app = express();
require('dotenv').config();
const cors = require("cors");
const cookieParser = require('cookie-parser');
const db=require('./mongooseConnection');
const registerRouter = require("./routes/registerRouter");
const loginRouter = require("./routes/loginRouter");
const protect = require("./controller/protect");
const profileRouter = require("./routes/profileRouter");

app.use(cors({
    origin:"https://avnilive.netlify.app",
    credentials:true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use("/register",registerRouter);
app.use("/login",loginRouter)
app.use("/profile",protect,profileRouter);
app.use("/post",protect,require("./routes/postRouter"));
app.use("/feed",require("./routes/feedRouter"))
app.listen(process.env.PORT,()=>{
    console.log("server is running on port " + process.env.PORT);
})