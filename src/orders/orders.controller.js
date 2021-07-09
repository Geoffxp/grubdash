const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

/* **** BEGIN INPUT VALIDATION AND LOCAL VARIABLE STORING **** */
const orderValidator = (req, res, next) => {
  const { data: {
    id = {},
    deliverTo = {},
    mobileNumber = {},
    status = {},
    dishes = {}
  } } = req.body;
  if (!(deliverTo.length && mobileNumber.length && dishes.length)) {
    return next({
      status: 400,
      message: `Order must include deliverTo, mobileNumber, status, and dishes`
    })
  }
  if (!Array.isArray(dishes)) {
    return next({
      status: 400,
      message: `Dishes must be an array, even if it is only 1 dish`
    })
  }
  for (dish in dishes) {
    if (!dishes[dish].quantity || dishes[dish].quantity == 0) {
      return next({
        status: 400,
        message: `Dish with id ${dishes[dish].id} does not have a quantity greater than 0`
      })
    }
    if (typeof dishes[dish].quantity !== 'number') {
      next({
        status: 400,
        message: `Dish with id ${dishes[dish].id} must include a numerical quantity`
      })
    }
  }
  // SETTING VALIDATED LOCAL VARIABLES FOR FUTURE METHODS
  res.locals.orderId = id;
  res.locals.deliverTo = deliverTo;
  res.locals.mobileNumber = mobileNumber;
  res.locals.status = status;
  res.locals.dishes = dishes;
  return next()
}

// FIND AND SET ORDER TO LOCAL VARIABLE
const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  return next({
    status: 404,
    message: `Order with id ${orderId} not found`
  })
}

// CHECKING FOR VALID STATUS CONDITIONS
const statusValidator = (req, res, next) => {
  const status = res.locals.status
  const validStatusList = ["pending", "preparing", "out-for-delivery", "delivered"]
  if (!status || !status.length || !validStatusList.includes(status)) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    })
  }
  if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`
    })
  }
  return next();
}



/* **** BEGIN HTTP METHODS **** */
const create = (req, res, next) => {
  const newOrder = {
    id: nextId(),
    deliverTo: res.locals.deliverTo,
    mobileNumber: res.locals.mobileNumber,
    status: res.locals.status,
    dishes: res.locals.dishes
  }
  orders.push(newOrder);
  res.status(201).send({ data: newOrder })
}

const update = (req, res, next) => {
  const { orderId } = req.params;
  const id = res.locals.orderId;
  if ((id && id.length) && !(orderId === id)) {
    return next({
      status: 400,
      message: `Route ${orderId} does not match given id ${id}`
    })
  }
  
  const index = orders.findIndex(order => order.id === orderId)
  const updatedOrder = {
    id: orderId,
    deliverTo: res.locals.deliverTo,
    mobileNumber: res.locals.mobileNumber,
    status: res.locals.status,
    dishes: res.locals.dishes
  }
  orders[index] = updatedOrder;
  res.status(200).send({ data: updatedOrder });
}

const read = (req, res, next) => {
  const foundOrder = res.locals.order
  res.json({ data: foundOrder})
}

const list = (req, res, next) => {
  res.json({ data: orders })
}

const destroy = (req, res, next) => {
  const { orderId } = req.params;
  const index = orders.findIndex(order => order.id === orderId);
  if (orders[index].status !== "pending"){
    return next({
      status: 400,
      message: `Order can only be deleted if status is 'pending'`
    })
  }
  if (index > -1 ) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  create: [orderValidator, create],
  update: [orderExists, orderValidator, statusValidator, update],
  read: [orderExists, read],
  list: list,
  delete: [orderExists, destroy]
}
