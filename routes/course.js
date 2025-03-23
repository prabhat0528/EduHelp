const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
const Course = require("../models/course");
const Lectures=require("../models/Lectures");
const multer=require("multer");
const {storage}=require("../cloudConfig.js");
const upload = multer({storage });


// CREATE COURSE LOGIC
router.post("/createCourse", upload.single("profilePhoto"), async (req, res) => {
    try {
        console.log("Received Data:", req.body);
         const {  title, description } = req.body;

        

       

        if (!req.user) {
            req.flash("error", "You must be logged in to create a course.");
            return res.redirect("/login");
        }


        let url=req.file.path;
        let filename=req.file.filename;

        let profilePhoto={url,filename};

        console.log(req.file.path);
        console.log(req.file.filename);
        const newCourse = new Course({
            title,
            profilePhoto,
            description,
            owner: req.user._id  
        });
        await newCourse.save();
        const user=req.user;
        user.enrolledCourses.push(newCourse._id);
        await user.save();


        req.flash("success", "Course created successfully!");
        res.redirect("/home");
    } catch (e) {
        console.error("Error creating course:", e);
        req.flash("error", e.message);
        res.redirect("/createCourse");
    }
});

router.get("/home/:id/addLecture",async(req,res)=>{
    const {id} =req.params;
    const course= await Course.findById(id);
    res.render("user/addLecture",{course});
}); 

router.post("/home/:id/addLecture", upload.fields([{ name: "video", maxCount: 1 }, { name: "profilePhoto", maxCount: 1 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);

        if (!course) {
            req.flash("error", "Course not found!");
            return res.redirect("/home");
        }

        // Ensure a video file is uploaded
        if (!req.files['video']) {
            req.flash("error", "Please upload a video file.");
            return res.redirect(`/home/${id}/addLecture`);
        }

        // Extract data
        const { title, description } = req.body;
        

        // Handle profile photo if uploaded
        const profilePhoto = req.files['profilePhoto'] ? {
            url: req.files['profilePhoto'][0].path,
            filename: req.files['profilePhoto'][0].filename
        } : null;

        const newLecture = new Lectures({
            title,
            description,
            video: {
                url: req.files['video'][0].path, 
                filename: req.files['video'][0].filename
            },
            profilePhoto, 
            course: course._id
        });

        await newLecture.save();
        course.lectures.push(newLecture._id);
        await course.save();

        req.flash("success", "Lecture added successfully!");
        res.redirect(`/home/${id}`);
    } catch (error) {
        console.error("Error adding lecture:", error);
        req.flash("error", "Something went wrong.");
        res.redirect(`/home/${id}/addLecture`);
    }
}); 

router.get("/home/:id", async (req, res) => {
    try {
        let { id } = req.params;
        console.log({id});
        const courseDetail = await Course.findById(id)
            .populate("owner")
            .populate("lectures");

        if (!courseDetail) {
            req.flash("error", "Course does not exist!");
            return res.redirect("/home");
        }

        res.render("user/show", { courseDetail, currUser: req.user });  
    } catch (error) {
        console.error("Error fetching course details:", error);
        req.flash("error", "Something went wrong.");
        res.redirect("/home");
    }
});



// EDIT LECTURE GET REQUEST
router.get("/home/:cId/:lId/edit", async (req, res) => {
    try {
        const { cId, lId } = req.params;
        const course = await Course.findById(cId);
        const lecture = await Lectures.findById(lId);

        // If either course or lecture is not found
        if (!course || !lecture) {
            req.flash("error", "Course or Lecture not found!");
            return res.redirect("/home");
        }

        res.render("user/editLecture", { course, lecture });
    } catch (error) {
        console.error("Error fetching course or lecture:", error);
        req.flash("error", "Something went wrong.");
        res.redirect("/home");
    }
});

router.put("/home/:cId/:lId/edit", upload.fields([{ name: "video", maxCount: 1 }, { name: "profilePhoto", maxCount: 1 }]), async (req, res) => {
    try {
        const { cId, lId } = req.params;
        const course = await Course.findById(cId); 
        const lecture = await Lectures.findById(lId); 

        if (!course || !lecture) {
            req.flash("error", "Course or Lecture not found!");
            return res.redirect("/home");
        }

        const { title, description } = req.body;
        const video = req.files['video'] ? {
            url: req.files['video'][0].path,
            filename: req.files['video'][0].filename
        } : lecture.video;  

        const profilePhoto = req.files['profilePhoto'] ? {
            url: req.files['profilePhoto'][0].path,
            filename: req.files['profilePhoto'][0].filename
        } : lecture.profilePhoto; 
        lecture.title = title;
        lecture.description = description;
        lecture.video = video;
        lecture.profilePhoto = profilePhoto;

        // Save the updated lecture
        await lecture.save();

        req.flash("success", "Lecture updated successfully!");
        res.redirect(`/home/${course._id}`); 
    } catch (error) {
        console.error("Error updating lecture:", error);
        req.flash("error", "Something went wrong.");
        res.redirect(`/home/${cId}/${lId}/edit`);
    }
});

//Delete Course
router.delete("/home/:id",async(req,res)=>{
    const {id}=req.params;
    await Course.findByIdAndDelete(id);
    req.flash("success","Course Deleted Successfully!");
    res.redirect("/home");
});



module.exports = router;


