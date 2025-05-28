const express = require("express");
const router = express.Router();
const Comment = require("../model/Comment");
const argon2 = require("argon2");

// Create comment or reply
router.post('/comments/:newsId', async (req, res) => {
  try {
    const { content, author, passcode, parentId } = req.body;
    if (!content || !author || !passcode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const passcodeHash = await argon2.hash(passcode);

    const newComment = new Comment({
      content,
      author,
      passcodeHash,
      parentId: parentId || null,
      news: req.params.newsId,
    });

    await newComment.save();
    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Edit comment
router.put("/comments/:commentId", async (req, res) => {
  try {
    const { content, passcode } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const valid = await argon2.verify(comment.passcodeHash, passcode);
    if (!valid) return res.status(401).json({ message: "Invalid passcode" });

    comment.content = content;
    await comment.save();

    res.json({ success: true, updatedComment: comment });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Optimized recursive delete
async function deleteCommentAndChildren(commentId) {
  const idsToDelete = [commentId];

  async function collectChildrenIds(id) {
    const children = await Comment.find({ parentId: id }, '_id');
    for (const child of children) {
      idsToDelete.push(child._id);
      await collectChildrenIds(child._id);
    }
  }

  await collectChildrenIds(commentId);
  await Comment.deleteMany({ _id: { $in: idsToDelete } });
}

// Delete comment and children
router.delete("/comments/:commentId", async (req, res) => {
  try {
    const { passcode } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const valid = await argon2.verify(comment.passcodeHash, passcode);
    if (!valid) return res.status(401).json({ message: "Invalid passcode" });

    await deleteCommentAndChildren(comment._id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Nest comments helper
function nestComments(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => map[c._id] = { ...c._doc, children: [] });

  comments.forEach(c => {
    if (c.parentId) {
      map[c.parentId]?.children.push(map[c._id]);
    } else {
      roots.push(map[c._id]);
    }
  });

  return roots;
}

// Get comments for newsId as nested tree
router.get("/comments/news/:newsId", async (req, res) => {
  try {
    const comments = await Comment.find({ news: req.params.newsId }).sort({ createdAt: 1 });
    const nested = nestComments(comments);
    res.json({ success: true, comments: nested });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
