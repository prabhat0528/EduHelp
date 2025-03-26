const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
const Course = require("../models/course");
const Lectures=require("../models/Lectures");
const multer=require("multer");
const {storage}=require("../cloudConfig.js");
const upload = multer({storage });

// SIGNUP
router.get("/signup", (req, res) => {
    res.render("user/signup");
});

router.post("/signup", async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const newUser = new User({ username, email, role });
        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to WonderRoam!");
            res.redirect("/home");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
});

// LOGIN
router.get("/login", (req, res) => {
    res.render("user/login");
});

router.post("/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    (req, res) => {
        req.flash("success", "Logged in Successfully!");
        res.redirect("/home");
    }
);

// LOGOUT
router.get("/logout", async (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/signup");
    });
});

//USER ROUTE ENDS HERE



router.get("/home/search", async (req, res) => {
    try {
        const searchValue = req.query.search; 

        if (!searchValue) {
            return res.redirect("/home");
        }

        // Case-insensitive search using regex
        const searchedCourses = await Course.find({ 
            title: { $regex: searchValue, $options: "i" } 
        }).populate("owner", "username");

        res.render("user/showResult", { searchedCourses });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/vision",(req,res)=>{
    res.render("user/vision");
})
router.get("/createCourse", (req, res) => {
    res.render("user/createCourse");
});



// HOME PAGE (SHOW ALL COURSES)
router.get("/home", async (req, res) => {
    try {
        const allCourses = await Course.find().populate('owner','username');
        console.log(allCourses);
        res.render("user/home", { allCourses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        req.flash("error", "Something went wrong.");
        res.redirect("/home");
    }
});

router.get("/home/showMyCourses", async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "enrolledCourses",
            select: "title profilePhoto owner", 
            populate: { path: "owner", select: "username" } 
        });

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/home");
        }

        const enrolledCourses = user.enrolledCourses || [];

        if (enrolledCourses.length === 0) {
            req.flash("error", "No Courses to Show");
            return res.redirect("/home");  
        }

        res.render("user/showMyCourses", { enrolledCourses });

    } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        req.flash("error", "Something went wrong.");
        res.redirect("/home");
    }
});


router.delete("/home/showMyCourses/:id", async (req, res) => {
    try {
        const userId = req.user._id;
        const courseId = req.params.id;
        await User.findByIdAndUpdate(userId, {
            $pull: { enrolledCourses: courseId }
        });

        req.flash("success", "Course removed from My Courses.");
        res.redirect("/home/showMyCourses");
    } catch (err) {
        console.error("Error removing course:", err);
        req.flash("error", "Failed to remove the course.");
        res.redirect("/home/showMyCourses");
    }
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

router.post("/home/addCourse/:id", async (req, res) => {
    try {
        const { id } = req.params;  
        const user = req.user; 

        if (!user) {
            req.flash("error", "You must be logged in to enroll in a course.");
            return res.redirect("/login");
        }

        const currentCourse = await Course.findById(id);

        if (!currentCourse) {
            req.flash("error", "Course not found!");
            return res.redirect("/home");
        }

        if (user.enrolledCourses.includes(currentCourse._id)) {
            req.flash("error", "You are already enrolled in this course.");
            return res.redirect("/home");
        }

        user.enrolledCourses.push(currentCourse._id);
        await user.save();

        req.flash("success", "Successfully enrolled in the course!");
        res.redirect("/home");
    } catch (error) {
        console.error("Error enrolling in course:", error);
        req.flash("error", "Something went wrong.");
        res.redirect("/home");
    }
});

// SHOW COURSE DETAILS
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
    const userId = req.user._id;
    const courseId = req.params.id;
    await User.findByIdAndUpdate(userId, {
        $pull: { enrolledCourses: courseId }
    });
    req.flash("success","Course Deleted Successfully!");
    res.redirect("/home");
});



module.exports = router;
