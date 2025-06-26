function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function convertInt(int) {
    return new Intl.NumberFormat("en").format(int);
}

module.exports = {
    getRandomInt,
    convertInt
};