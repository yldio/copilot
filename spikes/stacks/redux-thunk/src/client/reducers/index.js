// const reduceReducers = require('reduce-reducers');
const Redux = require('redux');

const printers = require('./printers');
const changes = require('./changes');

const {
  combineReducers
} = Redux;

module.exports = () => {
  return combineReducers({
    data: combineReducers({
      printers: printers.data,
      changes: changes.data
    }),
    ui: combineReducers({
      changes: changes.ui
    })
  });
};
