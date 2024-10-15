import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"



const registerUser = asyncHandler(async(req,res)=>{
    console.log(req)
    //get user details from front end
    //validation not empty
    //check if user already exits:  username, email
    //check for images, check for avatar
    //upload them to cloudinary, Avatar
    //create user object in db
    //remove password and user token from response
    //check for user creation

    const {username, fullName, email, password} = req.body;

    if(
        [username,fullName,email,password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username,email}]
    })

    if(existedUser){
        throw new ApiError(409,"User already exist");
    }

    let avatarLocalPath;

    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0){
        avatarLocalPath = req.files?.avatar[0]?.path;
    }

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        password:password,
        email:email,
        fullName:fullName,
        username:username,
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(400,"Something went wrong while registering user");
    }

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})



export {
    registerUser
}