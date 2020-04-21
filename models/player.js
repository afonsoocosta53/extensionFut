var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// set up a mongoose model
var PlayerSchema = new Schema({
  name: {
    type: String
  },
  rating: {
    type: Number
  },
  primeiro_preco: {
    type: Number
  },
  segundo_preco: {
    type: Number
  },
  terceiro_preco: {
    type: Number
  },
  quarto_preco: {
    type: Number
  },
  quinto_preco: {
    type: Number
  },
  sexto_preco: {
    type: Number
  },
  setimo_preco: {
    type: Number
  },
  ultimo_registado: {
    type: String
  },
  array_leiloes: {
    type: Array
  }
});

module.exports.createPlayer = function(newPlayer, callback) {
  newPlayer.save(callback);
};

module.exports.getPlayerByID = function(id, callback) {
  var query = { id_player: id };
  Player.findOne(query, callback);
};

module.exports = mongoose.model("Player", PlayerSchema);
