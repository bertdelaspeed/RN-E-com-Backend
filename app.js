const express = require("express");
let app = express();
require("dotenv").config();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");

const Product = require("./models/product");
const productsRouter = require("./routers/products");
const ordersRoute = require("./routers/orders");
const usersRoute = require("./routers/users");
const categoriesRoute = require("./routers/categories");
// const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

const api = process.env.API_URL;

app.use(cors());
app.options("*", cors());

// Middlewares
app.use(express.json());
app.use(morgan("tiny"));
// app.use(authJwt());
app.use(errorHandler);
app.use("public/uploads", express.static(__dirname + "/public/uploads"));

// Routes
app.use(`${api}/products`, productsRouter);
app.use(`${api}/orders`, ordersRoute);
app.use(`${api}/users`, usersRoute);
app.use(`${api}/categories`, categoriesRoute);

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("DB connection success");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(3000, () => {
  console.log(api);
  console.log("Server is running on http://localhost:3000");
});
