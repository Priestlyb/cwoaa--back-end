const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: String, required: true },
    passcodeHash: { type: String, required: true },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    news: { type: mongoose.Schema.Types.ObjectId, ref: "News", required: true }, // <-- important
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
