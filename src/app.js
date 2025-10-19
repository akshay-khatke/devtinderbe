console.log("start dev tinder")
const express=require("express")
const app=express()

// request handler
app.use('/',(req,res)=>{
    res.send("hellow from the server")
})
app.use("/test",(req,res)=>{
    res.send("hellow from the server")
})

app.use("/hello",(req,res)=>{
    res.send("hellow hellow the server")
})
app.use("/getData",(req,res)=>{
    res.send("hellow hellow the server")
})


app.listen(3000,()=>{
    console.log("successfull strat server")
})
