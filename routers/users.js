const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  const userList = await User.find({}, (err, users) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(users);
    }
  }).select("-passwordHash");
});

router.post("/", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });
  user = await user.save();
  if (!user) return res.status(500).send("user cannot be created");

  res.status(200).send(user);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id, (err, user) => {
    if (err) {
      res.status(500).json({ success: false, message: "Error finding user" });
    } else {
      res.status(200).json({ success: true, user: user });
    }
  }).select("-passwordHash");
});

router.post("/login", async (req, res) => {
  const secret = process.env.JWT_SECRET;
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(401).json({ success: false, message: "User not found" });

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      { expiresIn: "1d" }
    );
    return res.status(200).json({ success: true, user: user, token: token });
  } else {
    return res.status(401).json({ success: false, message: "Wrong password" });
  }
});

router.post("/register", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });
  user = await user.save();
  if (!user) return res.status(500).send("user cannot be created");

  res.status(200).send(user);
});

router.get("/get/count", async (req, res) => {
  const userCount = await User.countDocuments((err, count) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).json({ numberOfUsers: count });
    }
  });
});

router.delete("/:id", async (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (!user)
        return res
          .status(500)
          .json({ success: false, message: "User cannot be deleted" });

      res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
