import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
import {asyncHandler} "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(
                401,"Unauthorized request"
            )
        }
    } catch(error) {

    }
})