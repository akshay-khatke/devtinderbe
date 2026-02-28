console.log("start dev tinder")
import express from "express";
const app=express()
import connectDB from './config/database.js'
// import {adminAuth,userAuth} from"./middleware/auth.js"/
import User from "./model/user.js";
import { validateSignUpData } from "./utils/validation.js";
import cookieParser from "cookie-parser"; //if we want the read the cookies for that we will require this
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {userAuth} from "./middleware/auth.js"
import createServer from 'http'
import authRouter from "./routes/auth.js"
import requestRouter from "./routes/request.js"
import profileRouter from "./routes/profile.js"
import userRouter from "./routes/user.js"
import cors from "cors";
app.use(cookieParser())//middleware
app.use(express.json());//the data send in request is in json format so we need to use the express.json here we need the middle


app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));


app.use("/auth",authRouter)
app.use("/request",requestRouter)
app.use("/profile",profileRouter)
app.use("/user",userRouter)


// //herw it will check the requestc convert it into json object ware

// app.post("/user/register",async(req,res)=>{
//     console.log(req,'chedck body')
//    const userObj={
//     firstName:req.body.firstName,
//     lastName:req.body.lastName,
//     emailId:req.body.emailId,
//     password:req.body.password,
//     age:req.body.age,
//     gender:req.body.gender,
//     role:req.body.role
//    }
//    const user=new User(userObj)
//    try {
//     // validateSignUpData(req)
//     const saltRound=await bcrypt.genSalt(10)//more number more password safe
//     user.password=await bcrypt.hash(user.password,saltRound)
//      await user.save()
//     res.send("register succsful")
//    }catch(err){
//     console.log(err,"chekc the eeorooa")
//     res.status(400).send("Error 123",err.message)
//    }
   
// })
// app.get("/user/getUsers",async(req,res)=>{
//     //  const user=new User()
//     try{
//     const user=await User.find()
//       console.log(user,'chedck body')
//     res.send(user)
//     }catch(err){
//         console.log(err)
//         res.send("get users failed")
//     }
// })

app.get("/user/getUsers",async(req,res)=>{
    //  const user=new User()
    try{
    const user=await User.findOne({emailId:"akshay1@gmail.com"})
      console.log(user,'chedck body')
    res.send(user)
    }catch(err){
        console.log(err)
        res.send("get users failed")
    }
})

app.delete("/user/deleteUser",async(req,res)=>{
    //  const emailId=req.body.emailId
     console.log(req.body.id,'chedck bodyjadnjs')
    try{
    // const user=await User.findByIdAndDelete({emailId:"akshay1@gmail.com"})
      const user=await User.findByIdAndDelete({_id:req.body.id})
    res.send("user deletd succsefully")
    }catch(err){
        console.log(err)
        res.send("user deletd failed")
    }
})

app.patch("/user/updateUser",async(req,res)=>{
    const userId=req.body.id
     const userData=req.body
     const ALLOWED_UPDTAES=["firstName","lastName","age","gender","role"]
     const updateFields=Object.keys(userData).every(key=>ALLOWED_UPDTAES.includes(key))
   
    try{
        if(!updateFields){
            return res.status(400).send("invalid update fields")
        }
    // const user=await User.findByIdAndDelete({emailId:"akshay1@gmail.com"})
      const user=await User.findByIdAndUpdate({_id:userId},userData,{returnDocument:"before"})
      console.log(user,'chedck bodysfxvdjadnjs')
    res.send(user)
    }catch(err){        
        console.log(err)
        res.send("user updated failed")
    }
})

app.patch("/user/updateUser/:userId",async(req,res)=>{
    const userId=req.params.userId
     const userData=req.body
     const ALLOWED_UPDTAES=["firstName","lastName","age","gender","role"]
     const updateFields=Object.keys(userData).every(key=>ALLOWED_UPDTAES.includes(key))
   
    try{
        if(!updateFields){
            return res.status(400).send("invalid update fields")
        }
    // const user=await User.findByIdAndDelete({emailId:"akshay1@gmail.com"})
      const user=await User.findByIdAndUpdate({_id:userId},userData,{returnDocument:"before"})
      console.log(user,'chedck bodysfxvdjadnjs')
    res.send(user)
    res.cookie("token","aksncjsabdchubashgbghj")
    }catch(err){        
        console.log(err)
        res.send("user updated failed")
    }
})


// app.post("/user/login",async(req,res)=>{
//     const {emailId,password}=req.body
//     console.log(emailId,typeof password,'check the email and password')
//     try{
//             const user=await User.findOne({emailId:emailId})
//             console.log(user,'check the user data')
//            if(!user){
//             return res.status(400).send("user not found")
//         }
      
     
//         const isMatch=await user.verifyPassword(password)
//              if(!isMatch){
//             return res.status(400).send("invalid password")
//         }
//     const token=user.generateToken()
//     console.log(token,'check the token')
//       res.cookie("token",token,{expires:new Date(Date.now()+24*60*60*1000),httpOnly:true,secure:true,sameSite:"strict"})
//     res.send(user)
         
        
   
//     }catch(err){
//         console.log(err)
//         res.status(400).send("login failed")
//     }


// })

app.get("/user/profile",userAuth,async(req,res)=>{
    //  const user=new User()
    try{
 const user=req.user
      if(!user){
        return res.status(400).send("user does not found 123")
      }
     res.send(user)
    }catch(err){
        console.log(err)
        res.send("get profile failed")
    }
})



app.post("/sendConnectionRequest",userAuth,async(req,res)=>{
    try{
const user=req.user
console.log(user,'check the user sendConnection request')
        res.send("connection request sent successfully")
     
    }catch(err){
        console.log(err)
        res.send("connection sent failed")
    }
})



connectDB().then(() =>{
     console.log("Database connected established")
app.listen(3000,()=>{
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
