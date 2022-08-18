const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const categoryList = await Category.find({}, (err, categories) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(categories);
    }
  }).sort({ name: 1 });
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id, (err, category) => {
    if (err) {
      res
        .status(500)
        .json({ success: false, message: "Error finding category" });
    } else {
      res.status(200).json({ success: true, category: category });
    }
  });
});

router.post("/", async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });
  category = await category.save();
  if (!category) return res.status(500).send("Category cannot be created");

  res.status(200).send(category);
});

router.put("/:id", async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true },
    (err, category) => {
      if (err) {
        res
          .status(500)
          .json({ success: false, message: "Error finding category" });
      } else {
        res.status(200).json({ success: true, category: category });
      }
    }
  );
});

router.delete("/:id", async (req, res) => {
  Category.findByIdAndRemove(req.params.id)
    .then((category) => {
      if (!category)
        return res
          .status(500)
          .json({ success: false, message: "Category cannot be deleted" });

      res
        .status(200)
        .json({ success: true, message: "Category deleted successfully" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
