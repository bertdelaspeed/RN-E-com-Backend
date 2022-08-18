const { Order } = require("../models/order");
const express = require("express");
const { OrderItem } = require("../models/order-item");
const router = express.Router();

router.get("/", async (req, res) => {
  const orderList = await Order.find({}, (err, orders) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(orders);
    }
  })
    .populate("user", "name")
    .sort({ dateOrdered: -1 });
});
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id, (err, order) => {
    if (err) {
      res.status(500).json({ success: false, message: "Error finding order" });
    } else {
      res.status(200).json({ success: true, order: order });
    }
  })
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });
});

router.post("/", async (req, res) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });
      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );
  const orderItemsIdsResolved = await orderItemsIds;

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);
  // console.log(totalPrices);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: req.body.totalPrice,
    user: req.body.user,
  });
  order = await order.save();
  if (!order) return res.status(500).send("order cannot be created");

  res.status(200).send(order);
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true },
    (err, order) => {
      if (err) {
        res
          .status(500)
          .json({ success: false, message: "Error finding order" });
      } else {
        res.status(200).json({ success: true, order: order });
      }
    }
  );
});

router.delete("/:id", async (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndRemove(orderItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "Order deleted successfully" });
      } else {
        return res
          .status(500)
          .json({ success: false, message: "Order cannot be deleted" });
      }
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ success: false, message: "Error finding order" });
    });
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalsales: { $sum: "$totalPrice" },
      },
    },
  ]);

  if (!totalSales) {
    return res
      .status(500)
      .json({ success: false, message: "total sales cannot be generated" });
  } else {
    res
      .status(200)
      .json({ success: true, totalSales: totalSales.pop().totalsales });
  }
});

router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (!orderCount) {
    return res
      .status(500)
      .json({ success: false, message: "orderCount cannot be generated" });
  } else {
    res.status(200).json({ success: true, orderCount: orderCount });
  }
});

router.get("/get/userorders/:userid", async (req, res) => {
  const userOrdersList = await Order.find(
    { user: req.params.userid },
    (err, orders) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(orders);
      }
    }
  )
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });
});

module.exports = router;
