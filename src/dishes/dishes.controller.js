const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//Middleware
function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${req.params.dishId}`,
  });
}

function dishHasName(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) {
    return next();
  }
  next({ status: 400, message: `Dish must include a name` });
}
function dishHasDescription(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    return next();
  }
  next({ status: 400, message: `Dish must include a description` });
}
function dishHasImageUrl(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    return next();
  }
  next({ status: 400, message: `Dish must include a image_url` });
}
function dishHasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price) {
    return next();
  }
  next({ status: 400, message: `Dish must include a price` });
}
function dishHasPriceGreaterThanZero(req, res, next) {
  const price = req.body.data.price;
  if (Number.isInteger(price) && price > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body;

  const { dishId } = req.params;

  if (id === dishId || !id) {
    return next();
  }
  next({ status: 400, message: `id ${id} does not match dish id ${dishId}` });
}

//HTTP Request functions

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  res.json({ data: foundDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

module.exports = {
  list,
  create: [
    dishHasDescription,
    dishHasName,
    dishHasPriceGreaterThanZero,
    dishHasPrice,
    dishHasImageUrl,
    create,
  ],
  update: [
    dishExists,
    idMatches,
    dishHasDescription,
    dishHasName,
    dishHasPriceGreaterThanZero,
    dishHasPrice,
    dishHasImageUrl,
    update,
  ],
  read: [dishExists, read],
};
