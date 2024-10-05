import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

//to accept json data
app.use(express.json({limit: "16kb"}))

//encode url like it change space to %20
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
})) 

//to have access to public directory
app.use(express.static("public")) 

//to set and get cookies
app.use(cookieParser())

export {app}