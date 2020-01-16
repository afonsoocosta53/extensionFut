var express = require("express");
var app = express();
const Excel = require("exceljs");
var bodyParser = require("body-parser");

app.use(bodyParser.json());
var workbook = new Excel.Workbook();
var strFilename = "dados.xlsx";

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

/* FUNCAO PARA ATULAIZAR A LISTA DOS JOGADORES COM OS PREÇOS DA WATCHLIST */
app.post("/updateTransfer", (req, res, next) => {
  var playersList = req.body;
  checkList(playersList)
    .then(() => {
      res.json({ success: "players refreshed with success" });
    })
    .catch();
});

/* FUNCAO QUE VERIFICA SE O JOGADOR EXISTE NO FICHEIRO */
var checkIDonList = function(idPlayer, auctionID, currentBid) {
  var promise = new Promise(function(resolve, reject) {
    workbook.xlsx.readFile(strFilename).then(function() {
      var worksheet = workbook.getWorksheet("Sheet1");
      var nameCol = worksheet.getColumn("A");
      var arrayIDsColumn = nameCol.values;
      if (arrayIDsColumn.includes(parseInt(idPlayer))) {
        nameCol.eachCell(function(cell, rowNumber) {
          if (parseInt(idPlayer) === parseInt(cell.value)) {
            checkIDOnArray(auctionID, rowNumber).then(result => {
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
                nameRow.getCell("J").value = arrayAuct + ',"' + auctionID + '"';
                workbook.xlsx
                  .writeFile(strFilename)
                  .then(function() {})
                  .catch(() => {
                    console.log("err ao registar");
                  });
                resolve();
              }
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
          .then(function() {})
          .catch(() => {
            console.log("err ao registar");
          });
        resolve("Not Existent");
      }
    });
  });
  return promise;
};

/* FUNCAO QUE VAI PEGAR EM CADA JOGADOR PARA SER VERIFICADO */
var checkList = function(listPlayers) {
  var promise = new Promise(function(resolve, reject) {
    var numeroPlayersToCheck = listPlayers.length;
    var zero = 0;
    listPlayers.forEach(player => {
      var idPlayer = player.itemData.id;
      var auctionID = player.tradeId;
      var tradeState = player.tradeState;
      var currentBid = player.currentBid;
      var startingBid = player.startingBid;
      if (
        tradeState === "closed" &&
        parseInt(currentBid) !== parseInt(startingBid)
      ) {
        checkIDonList(idPlayer, auctionID, currentBid).then(data => {
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

var checkIDOnArray = function(auctionID, rowNumber) {
  var promise = new Promise(function(resolve, reject) {
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
