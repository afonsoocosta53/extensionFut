var express = require("express");
var app = express();
const Excel = require("exceljs");
var bodyParser = require("body-parser");
var cors = require("cors");
app.use(bodyParser.json());
var workbook = new Excel.Workbook();
var strFilename = "dados.xlsx";
var mongoose = require("mongoose");
var passport = require("passport");
var config = require("./config/database"); // get db config file
var Player = require("./models/player"); // get the mongoose model
mongoose.connect(config.database);
var db = mongoose.connection;
const rp = require("request-promise");
const $ = require("cheerio");
var request = require("request");
app.use(cors());
// Use the passport package in our application
app.use(passport.initialize());
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

/* FUNCAO PARA ATULAIZAR A LISTA DOS JOGADORES COM OS PREÇOS DA WATCHLIST */
app.post("/updateTransfer", (req, res, next) => {
  var playersList = req.body.arrayPlayers;
  console.log(playersList.length);
  checkArrayPlayers(playersList).then((data) => {
    res.json({ success: "players refreshed with success" });
    console.log("UPDATE TRANSFER LIST");
  });
  /* checkList(playersList)
    .then(() => {
      res.json({ success: "players refreshed with success" });
    })
    .catch(err => {
      console.log("*****************LOG ERR*****************");
      console.log("ERRO NO updateTransfer");
      console.log(err);
    }); */
});

/* FUNCAO QUE VERIFICA SE O JOGADOR EXISTE NO FICHEIRO */
var checkIDonList = function (idPlayer, auctionID, currentBid) {
  var promise = new Promise(function (resolve, reject) {
    workbook.xlsx.readFile(strFilename).then(function () {
      var worksheet = workbook.getWorksheet("Sheet1");
      var nameCol = worksheet.getColumn("A");
      var arrayIDsColumn = nameCol.values;
      if (arrayIDsColumn.includes(parseInt(idPlayer))) {
        nameCol.eachCell(function (cell, rowNumber) {
          if (parseInt(idPlayer) === parseInt(cell.value)) {
            checkIDOnArray(auctionID, rowNumber)
              .then((result) => {
                if (result === "Auction already registered") {
                  resolve("Auction already registered");
                } else if (result === "Auction not registered") {
                  var nameRow = worksheet.getRow(rowNumber);
                  var lastAdded = nameRow.getCell("I").value;
                  switch (lastAdded) {
                    case "B":
                      nameRow.getCell("C").value = currentBid;
                      nameRow.getCell("I").value = "C";
                      break;
                    case "C":
                      nameRow.getCell("D").value = currentBid;
                      nameRow.getCell("I").value = "D";
                      break;
                    case "D":
                      nameRow.getCell("E").value = currentBid;
                      nameRow.getCell("I").value = "E";
                      break;
                    case "E":
                      nameRow.getCell("F").value = currentBid;
                      nameRow.getCell("I").value = "F";
                      break;
                    case "F":
                      nameRow.getCell("G").value = currentBid;
                      nameRow.getCell("I").value = "G";
                      break;
                    case "G":
                      nameRow.getCell("H").value = currentBid;
                      nameRow.getCell("I").value = "H";
                      break;
                    case "H":
                      nameRow.getCell("B").value = currentBid;
                      nameRow.getCell("I").value = "B";
                      break;
                  }
                  var arrayAuct = nameRow.getCell("J").value;
                  nameRow.getCell("J").value =
                    arrayAuct + ',"' + auctionID + '"';
                  workbook.xlsx
                    .writeFile(strFilename)
                    .then(function () {})
                    .catch((err) => {
                      console.log("*****************LOG ERR*****************");
                      console.log("ERRO NO registar");
                      console.log(err);
                    });
                  resolve();
                }
              })
              .catch((err) => {
                console.log("*****************LOG ERR*****************");
                console.log("ERRO NO checkIDonList");
                console.log(err);
              });
          }
        });
      } else {
        var rowValues = [];
        rowValues[1] = parseInt(idPlayer);
        rowValues[2] = currentBid;
        rowValues[9] = "B";
        rowValues[10] = '"' + auctionID + '"';
        worksheet.addRow(rowValues);
        workbook.xlsx
          .writeFile(strFilename)
          .then(function () {})
          .catch((err) => {
            console.log("*****************LOG ERR*****************");
            console.log("ERRO NO registar");
            console.log(err);
          });
        resolve("Not Existent");
      }
    });
  });
  return promise;
};

/* FUNCAO QUE VAI PEGAR EM CADA JOGADOR PARA SER VERIFICADO */
var checkList = function (listPlayers) {
  var promise = new Promise(function (resolve, reject) {
    var numeroPlayersToCheck = listPlayers.length;
    var zero = 0;
    listPlayers.forEach((player) => {
      var idPlayer = player.itemData.assetId;
      var auctionID = player.tradeId;
      var tradeState = player.tradeState;
      var currentBid = player.currentBid;
      var startingBid = player.startingBid;
      if (
        tradeState === "closed" &&
        parseInt(currentBid) !== parseInt(startingBid)
      ) {
        console.log(idPlayer);
        checkIDonList(idPlayer, auctionID, currentBid).then((data) => {
          zero++;
          if (zero === numeroPlayersToCheck) {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
  return promise;
};

var checkIDOnArray = function (auctionID, rowNumber) {
  var promise = new Promise(function (resolve, reject) {
    var auctionMatch = '"' + auctionID + '"';
    var worksheet = workbook.getWorksheet("Sheet1");
    var nameRow = worksheet.getRow(rowNumber);
    var oneAuction = nameRow.getCell("J").value;
    var arrayAuctions = oneAuction.split(",");
    if (arrayAuctions.includes(auctionMatch)) {
      resolve("Auction already registered");
    } else {
      resolve("Auction not registered");
    }
  });
  return promise;
};

var checkArrayPlayers = function (playersList) {
  var promise = new Promise(function (resolve, reject) {
    playersList.forEach((player) => {
      checkPlayerBD(player).then((data) => {
        resolve();
      });
    });
  });
  return promise;
};

var checkPlayerBD = function (player) {
  var promise = new Promise(function (resolve, reject) {
    Player.findOne(
      {
        name: player.playerName,
        rating: parseInt(player.playerRating),
      },
      function (err, playerBD) {
        if (err) throw err;
        if (!playerBD) {
          console.log("player need to be added");
          addPlayerBD(player).then((data) => {
            resolve();
          });
        } else {
          editPlayerBD(playerBD, player).then((data) => {
            resolve();
          });
        }
        /* /* console.log(player.array_leiloes);
          console.log(typeof player.array_leiloes);
          var newArray = player.array_leiloes;
          newArray.push(123);
          console.log(newArray);
          var newPlayer = {
            $set: {
              segundo_preco: 444,
              ultimo_registado: "segundo_preco",
              array_leiloes: newArray
            }
          };
          var myquery = { id_player: 1234 };
          db.collection("players").updateOne(myquery, newPlayer, function(
            err,
            dbb
          ) {
            if (err) {
              return res.json({
                success: false,
                msg: "Erro on edit player."
              });
            } else {
              return res.json({ success: true, msg: "Player edited." });
            }
          });
        } */
      }
    );
  });
  return promise;
};

app.post("/registerPlayer", (req, res, next) => {
  var newPlayer = new Player({
    id_player: 1234,
    primeiro_preco: 1234,
    ultimo_registado: "primeiro_preco",
    array_leiloes: [1234],
  });
  newPlayer.save(function (err, player) {
    if (err) {
      console.log(err);
      res.json({ sucess: false });
    } else {
      res.json({ sucess: true, contacto: player });
    }
  });
});

var addPlayerBD = function (player) {
  var promise = new Promise(function (resolve, reject) {
    var price = player.playerPrice.replace(/[`~!,\{\}\[\]\\\/]/gi, "");
    var newPlayer = new Player({
      name: player.playerName,
      rating: parseInt(player.playerRating),
      ultimo_registado: "primeiro_preco",
      primeiro_preco: parseInt(price),
    });
    newPlayer.save(function (err, player) {
      resolve();
    });
  });
  return promise;
};

var editPlayerBD = function (playerBD, player) {
  var promise = new Promise(function (resolve, reject) {
    var price = player.playerPrice.replace(/[`~!,\{\}\[\]\\\/]/gi, "");
    console.log(price, playerBD.primeiro_preco);
    if (parseInt(price) != parseInt(playerBD.primeiro_preco)) {
      var newPlayer = {
        $set: {
          segundo_preco: parseInt(price),
          ultimo_registado: "segundo_preco",
        },
      };
      var myquery = {
        name: player.playerName,
        rating: parseInt(player.playerRating),
      };
      db.collection("players").updateOne(myquery, newPlayer, function (
        err,
        dbb
      ) {
        if (err) {
          resolve();
        } else {
          console.log("player edited");
          resolve();
        }
      });
    }
  });
  return promise;
};

app.post("/editarPlayer", (req, res, next) => {
  Player.findOne(
    {
      id_player: 1234,
    },
    function (err, player) {
      if (err) throw err;
      if (!player) {
        return res.status(403).send({
          success: false,
          msg: "No player found with the ID",
        });
      } else {
        console.log(player.array_leiloes);
        console.log(typeof player.array_leiloes);
        var newArray = player.array_leiloes;
        newArray.push(123);
        console.log(newArray);
        var newPlayer = {
          $set: {
            segundo_preco: 444,
            ultimo_registado: "segundo_preco",
            array_leiloes: newArray,
          },
        };
        var myquery = { id_player: 1234 };
        db.collection("players").updateOne(myquery, newPlayer, function (
          err,
          dbb
        ) {
          if (err) {
            return res.json({
              success: false,
              msg: "Erro on edit player.",
            });
          } else {
            return res.json({ success: true, msg: "Player edited." });
          }
        });
      }
    }
  );
});

app.get("/getDividendYears", (req, res, next) => {
  var ticker = req.query.ticker;
  var stock = {};
  var url;

  var ketStatistics = function () {
    var promise = new Promise(function (resolve, reject) {
      url =
        "https://finance.yahoo.com/quote/" +
        ticker +
        "/key-statistics?p=" +
        ticker;
      rp(url)
        .then(function (html) {
          stock.anualDividend = $(
            "td[class='Fw(500) Ta(end) Pstart(10px) Miw(60px)']",
            html
          )
            .eq(18)
            .text();
          stock.payoutRatio = $(
            "td[class='Fw(500) Ta(end) Pstart(10px) Miw(60px)']",
            html
          )
            .eq(23)
            .text();
          stock.exDividendDate = $(
            "td[class='Fw(500) Ta(end) Pstart(10px) Miw(60px)']",
            html
          )
            .eq(25)
            .text();
          stock.dividendDate = $(
            "td[class='Fw(500) Ta(end) Pstart(10px) Miw(60px)']",
            html
          )
            .eq(24)
            .text();
          resolve();
        })
        .catch(function (err) {
          resolve();
        });
    });
    return promise;
  };

  var profile = function () {
    var promise = new Promise(function (resolve, reject) {
      url =
        "https://finance.yahoo.com/quote/" + ticker + "/profile?p=" + ticker;
      rp(url)
        .then(function (html) {
          stock.sector = $("span[class='Fw(600)']", html).eq(0).text();
          resolve();
        })
        .catch(function (err) {
          resolve();
        });
    });
    return promise;
  };

  ketStatistics()
    .then(profile)
    .then(() => {
      res.json({ status: true, stock: stock });
    })
    .catch((e) => {
      res.status(400).json({ status: "error" });
    });
});
