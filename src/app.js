console.log("start dev tinder")
import express from "express";
const app=express()
import connectDB from './config/database.js'
// import {adminAuth,userAuth} from"./middleware/auth.js"/
import User from "./model/user.js";
import { validateSignUpData } from "./utils/validation.js";
import cookieParser from "cookie-parser"; //if we want the read the cookies for that we will require this
import authRouter from "./routes/auth.js"
import requestRouter from "./routes/request.js"
import profileRouter from "./routes/profile.js"
import userRouter from "./routes/user.js"
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { socketConnection } from "./utils/socket.js";
import chatRouter from "./routes/chat.js";
import resumeRouter from "./routes/resume.js";

dotenv.config();

//origin.endsWith(".vercel.app") edge case

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://devtinder-ixaw94g93-akshay-khatkes-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
      ];
      if (!origin || allowedOrigins.includes(origin) || origin.includes("vercel.app") || origin.includes("localhost")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

app.use(cookieParser())//middleware
app.use(express.json());//the data send in request is in json format so we need to use the express.json here we need the middle


app.use("/auth",authRouter)
app.use("/request",requestRouter)
app.use("/profile",profileRouter)
app.use("/user",userRouter)
app.use("/chat",chatRouter)
app.use("/resume", resumeRouter)



const httpServer =createServer(app)
socketConnection(httpServer)
connectDB().then(() =>{
     console.log("Database connected established")
httpServer.listen(process.env.PORT,()=>{
    console.log("successfull strat server")
})


})
    .catch((err) => console.log(err))





// require("./config/database")

// connectDB()

// request handler
//the sequesce of the  route handleres is mattere
// app.use('/',(req,res)=>{
//     res.send("hellow from the server")
// })
// app.use("/test",(req,res)=>{
//     res.send("hellow from the server")
// })

// app.use("/hello",(req,res)=>{
//     res.send("hellow hellow the server")
// })
// app.use("/getData",(req,res)=>{
//     res.send("hellow hellow the server")
// })

// app.get('/user',(res)=>{

// res.send({fn:"akshay",ln:"khatke"})
// })

// app.delete('/user',(res)=>{
    
// res.send("deleted succseffuly")
// })

// app.post('/user',(res)=>{
    
// res.send("post succseffuly")
// })
// app.post('/user',(res)=>{
    
// res.send("patch succseffuly")
// })
// query string params
// app.post('/user?userId=101',(res)=>{
    
// res.send("patch succseffuly")
// })

// dynamic handling

// app.post('/user/:userId/:name/:password',(res)=>{
    
// res.send("patch succseffuly")
// })
// Multiple request hanldres
// app.get('/user',(req,res,next)=>{
    
// console.log("patch succseffuly")

// next()//when we put this taht time only goes to the second funtion else it will check the first oe only
// ,()=>{

// console.log("patch succseffuly")
// res.send("response 2")


// }})
// // scenario 2 
// app.get('/user',(req,res,next)=>{
    
// console.log("patch succseffuly")
// res.send("response 1")
// next()//when we put this taht time only goes to the second funtion else it will check the first oe only
// ,()=>{

// console.log("patch succseffuly")
// res.send("response 2")


// }})

//befiore sceanrio 2

// app.get('/user',(req,res,next)=>{
    
// console.log("patch succseffuly")
// next()//when we put this taht time only goes to the second funtion else it will check the first oe only

// res.send("response 1")
// ,()=>{

// console.log("patch succseffuly 2")
// res.send("response 2")


// }})

// output 
// patch succseffuly consoles
// patch succseffuly 2 consoles
// response 2

// error for res.send("response 1")




// ----

// we want next always to go in next request hanldres



// app.get('/user',(req,res,next)=>{
    
// console.log("patch succseffuly")
// next()//when we put this taht time only goes to the second funtion else it will check the first oe only

// res.send("response 1")
// ,()=>{

// console.log("patch succseffuly 2")
// res.send("response 2")


// }})

// app.get('/user',(req,res,next)=>{
    
// console.log("patch succseffuly")
// next()//when we put this taht time only goes to the second funtion else it will check the first oe only

// res.send("response 2")
// ,()=>{

// console.log("patch succseffuly 3")
// res.send("response 2")


// }},
// ()=>{

// })
// the inner function called midlewwares



// for middleware
// we use the app.use
// app.use("/admin",(req,res,next)=>{
//     if(!auth){
//  res.status(401).send("authentication error")
//     }else{
//         next()
//     }

// })
// app.use("/admin/getAlluser",(req,res,next)=>{
  
//    res.send("Resp send successfully")
   

// })


// app.use("/admin",adminAuth)
// app.use("/user",userAuth)
// app.get("/user/login",(req,res)=>{
//     res.send("login succsful")
// })
