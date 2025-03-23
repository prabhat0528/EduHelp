const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
    profilePhoto: {
        url: String,
        filename: String,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    // thumbnail: {
    //     type: String,
    //     required: true,
    // },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
       
    },
    lectures: [
        {
            type: Schema.Types.ObjectId,
            ref: "Lectures",
        }
    ]
});

module.exports = mongoose.model("Course", courseSchema);
