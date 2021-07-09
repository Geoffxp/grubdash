const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

/* **** BEGIN INPUT VALIDATION AND LOCAL VARIABLE STORING **** */
const dishValidator = (req, res, next) => {
  const { data: { 
    id = {},
    name = {},
    description = {},
    price = {},
    image_url = {} 
    } } = req.body;
  if (!(name.length && description.length && price > 0 && image_url.length)) {
    return next({
      status: 400,
      message: `Dish must include a name, description, non-zero price, and image_url`
    })
  }
  if (typeof price !== 'number') {
    next({
      status: 400,
      message: `Dish must include a numerical price`
    })
  }
  // SETTING VALIDATED LOCAL VARIABLES FOR FUTURE METHODS
  res.locals.id = id;
  res.locals.name = name;
  res.locals.description = description;
  res.locals.price = price;
  res.locals.image_url = image_url;
  return next();
  
}

// FINDING AND SETTING REQUESTED DISH TO LOCAL VARIABLE
const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id == dishId)
  if (foundDish) {
    res.locals.dish = foundDish
    return next();
  }
  return next({
    status: 404,
    message: `Dish with id ${dishId} was not found`
  })
}

/* **** BEGIN HTTP METHODS **** */
const create = (req, res, next) => {
  const newDish = {
    id: nextId(),
    name: res.locals.name,
    description: res.locals.description,
    price: res.locals.price,
    image_url: res.locals.image_url
  }
  dishes.push(newDish);
  res.status(201).send({ data: newDish })
}

const update = (req, res, next) => {
  const { dishId } = req.params;
  const id = res.locals.id
  if ((id && id.length) && !(dishId === id)) {
    return next({
      status: 400,
      message: `Route ${dishId} does not match given id ${res.locals.id}`
    })
  }
  const index = dishes.findIndex(dish => dish.id === dishId)
  const updatedDish = {
    id: dishId,
    name: res.locals.name,
    description: res.locals.description,
    price: res.locals.price,
    image_url: res.locals.image_url
  }
  dishes[index] = updatedDish
  res.status(200).send({ data: updatedDish })
}

const list = (req, res, next) => {
  res.json({ data: dishes })
}

const read = (req, res, next) => {
  const foundDish = res.locals.dish
  res.json({ data: foundDish})
}

module.exports = {
  create: [dishValidator, create],
  update: [dishExists, dishValidator, update],
  read: [dishExists, read],
  list: list
}
