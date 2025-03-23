const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const lectureSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    video: {
        url: String,
        filename: String
    },
    profilePhoto: {
        url: String,
        filename: String
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course"
    }
});

module.exports = mongoose.model("Lectures", lectureSchema);
