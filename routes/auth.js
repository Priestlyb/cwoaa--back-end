const router = require("express").Router();
const User = require("../model/User");
const argon2 = require("argon2");

//REGISTER
router.post("/register", async (req, res) => {
  try {
    const hashedPassword = await argon2.hash(req.body.password);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json("Wrong credentials!");

    const validated = await argon2.verify(user.password, req.body.password);
    if (!validated) return res.status(400).json("Wrong credentials!");

    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    console.error("Login error:", err); // For debugging
    res.status(500).json("Internal server error");
  }
});


module.exports = router;
