const express = require("express");
const { Category } = require("../models/category");
const { Product } = require("../models/product");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");
    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    const fileName = file.originalname.split(" ").join("_");
    cb(null, `${fileName} - ${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const productList = await Product.find(filter, (err, products) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(products);
      // console.log("Filter :", filter);
    }
  }).populate("category");
  // .select("name image _id")
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id, (err, product) => {
    if (err) {
      res
        .status(500)
        .json({ success: false, message: "Error finding product" });
    } else {
      res.status(200).json({ success: true, product: product });
    }
  }).populate("category");
});

router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();

  if (!product) return res.status(500).send("The product cannot be created");

  res.send(product);
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product Id");
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send("Invalid Product ");

    const category = await Category.findById(req.body.category);
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "Invalid category" });

    const file = req.file;
    let imagepath;
    if (file) {
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      imagepath = `${basePath}${fileName}`;
    } else {
      imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagepath,
        brand: req.body.brand,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
      },
      { new: true }
    );

    if (!updatedProduct)
      return res.status(500).send("Product cannot be updated");
    res.send(updatedProduct);
  } catch (error) {
    res.status(400).send("Category prolly messed up");
  }
});

router.delete("/:id", async (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (!product)
        return res
          .status(500)
          .json({ success: false, message: "Product cannot be deleted" });

      res
        .status(200)
        .json({ success: true, message: "Product deleted successfully" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.get("/get/count", async (req, res) => {
  const count = await Product.countDocuments();
  if (!count) return res.status(500).send("Error counting products");
  res.status(200).json({ success: true, count: count });
});

router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 3;
  const products = await Product.find({ isFeatured: true }).limit(count);
  if (!products) return res.status(500).send("Error finding products");
  res.status(200).json({ success: true, FeaturedProducts: products });
});

router.put(
  "/galery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product Id");
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(400).send("Invalid Product ");

      const files = req.files;
      let imagePaths = [];
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      if (files) {
        files.map((file) => {
          imagePaths.push(`${basePath}${file.fileName}`);
        });
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          images: imagePaths,
        },
        { new: true }
      );

      if (!updatedProduct)
        return res.status(500).send("Product cannot be updated");
      res.send(updatedProduct);
    } catch (error) {
      res.status(400).send("Category prolly messed up");
    }
  }
);

module.exports = router;
