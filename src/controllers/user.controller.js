import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        console.log(userId)
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false});

        return {accessToken,refreshToken}
    } catch(error){
        console.log(error)
        throw new ApiError(500,"Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    //get user details from front end
    //validation not empty
    //check if user already exits:  username, email
    //check for images, check for avatar
    //upload them to cloudinary, Avatar
    //create user object in db
    //remove password and user token from response
    //check for user creation

    const {username, fullName, email, password} = req.body;
    console.log(password)

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

const loginUser = asyncHandler(async (req,res)=>{
    //take login details from user
    //check if user with username or email exits
    //if user exits then verify password
    //generate access token and refresh token
    //send cookies

    const {username, email, password} = req.body;
    console.log(username)
    console.log(email)
    console.log(password)

    if(!username && !email){
        throw new ApiError(404,"username or email required");
    }

    const user = await User.findOne(
        {
            $or : [{username}, {email}]
        }
    )

    if(!user){
        throw new ApiError(404,"username or email incorrect")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Credentials")
    }

    const {accessToken,refreshToken} = generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
})


const logoutUser = asyncHandler(async (req,res)=>{
    console.log(req)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken:1 //this will remove refreshToken from mongodb
            }
        },
        {
            new:true
        }
    )


    const options = {
        httpOnly:true,
        secure:true
    }


    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,{},"User logout succesfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser
}