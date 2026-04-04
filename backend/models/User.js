const mongoose=require("mongoose")
const UserSchema=new mongoose.Schema({
    name:{type:String,required:true,message:"Name is required"},
    email:{type:String,required:true,message:"Email is required",unique:true},
    password:{type:String,required:true,message:"Password is required"},
},
{timestamps:true}
)
module.exports=mongoose.model("User",UserSchema)