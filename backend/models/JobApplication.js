const mongoose=require("mongoose")
const jobSchema=new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    companyName:String,
    role:String,
    jobLink:String,
    status:{type:String,enum:["Applied","Interviewing","Offered","Rejected"],default:"Applied"},
    notes:String,

},

{timestamps:true})

module.exports=mongoose.model("JobApplication",jobSchema)