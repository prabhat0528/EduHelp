const mongoose =require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new Schema({
    email:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum:["instructor","student"],
        default: "student",
    },
    enrolledCourses:[
        {
            type: Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
   
},{timestamps:true});
userSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model('User',userSchema);