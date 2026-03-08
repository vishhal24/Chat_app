import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req,res)=>{
    const {fullName , email , password} = req.body;

    try{
        if(!fullName || !email || !password){
            return res.status(400).json({
                message : "Please fill all the fields"
            });
        }
 
        if(password.length < 6){
            return res.status(400).json({
                message : "Password must be at least 6 characters long"
            });
        }

        const user = await User.findOne({email});

        if(user){
            return res.status(400).json({
                message : "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password , salt);

        const newUser = new User({
            fullName,
            email,
            password : hashedPassword
        });

        generateToken(newUser._id,res);

        await newUser.save();

        res.status(201).json({
            _id : newUser._id,
            fullName : newUser.fullName,
            email : newUser.email,
            profilePic : newUser.profilePic
        });

    }catch (err) {
        console.log("Error in signup controller", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const login = async (req,res)=>{
    const {email , password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                message : "Invalid credentials"
            })
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({
                message : "Invalid credentials"
            });
        }
        generateToken(user._id,res);
        res.status(200).json({
            _id : user._id,
            fullName : user.fullName,
            email : user.email,
            profilePic : user.profilePic    
        })
    }
    catch (err) {
        console.log("Error in login controller", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }  
}

export const logout = (req,res)=>{
    try{
        res.clearCookie("jwt","",{maxAge:0})
        res.status(200).json({
            message : "Logged out successfully"
        });
    }catch(err){
        console.log("Error in logout controller", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const updateProfile = async (req,res)=>{
    try{
        const {profilePic} = req.body;
        const userId = req.user._id;
        if(!profilePic){
            return res.status(400).json({
                message : "Profile picture is required"
            });
        }
       const uploadResponse = await cloudinary.uploader.upload(profilePic);
       const updateUser = await User.findByIdAndUpdate(userId,{
        profilePic : uploadResponse.secure_url
       },{new : true});
         res.status(200).json({
            _id : updateUser._id,
            fullName : updateUser.fullName,
            email : updateUser.email, 
            profilePic : updateUser.profilePic    
        }); 
    }
    catch(err){
        console.log("Error in update profile controller", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};