const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
const dishesData = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
//Middleware functions
function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
}

function orderHasDeliverTo(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({ status: 400, message: `Order must include a deliverTo` });
}
function orderHasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({ status: 400, message: `Order must include a mobileNumber` });
}
function orderHasStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}
function orderIsNotDelivered(req, res, next) {
  const status = res.locals.order.status;

  if (status == "pending") {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}
function orderHasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (dishes) {
    return next();
  }
  next({ status: 400, message: `Order must include a dishes` });
}
function dishesIsArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}
function dishHasQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body;

  const { orderId } = req.params;

  if (id === orderId || !id) {
    return next();
  }
  next({ status: 400, message: `id ${id} does not match order id ${orderId}` });
}

// HTTP request functions
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
function read(req, res) {
  res.json({ data: res.locals.order });
}
function update(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

  const foundOrder = res.locals.order;
  foundOrder.status = status;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    orderHasDeliverTo,
    orderHasMobileNumber,

    orderHasDishes,
    dishesIsArray,
    dishHasQuantity,
    create,
  ],
  update: [
    orderExists,
    idMatches,
    orderHasDeliverTo,
    orderHasMobileNumber,
    orderHasStatus,

    orderHasDishes,
    dishesIsArray,
    dishHasQuantity,
    update,
  ],
  delete: [orderExists, orderIsNotDelivered, destroy],
};
