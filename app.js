const https = require("https");
const request = require("request");
const id = "5e693d09ad14fb001488679c";
var prices = [];
var supplies = [];
var spents = [];
var currentGas = 0.0;
var finalResult = [];

https
  .get(
    "https://challenge-for-adventurers.herokuapp.com/data/" + id + "/prices",
    resp => {
      let data = "";

      // A chunk of data has been recieved.
      resp.on("data", chunk => {
        data += chunk;
      });
      // The whole response has been received. Print out the result.
      resp.on("end", () => {
        prices = JSON.parse(data);

        https
          .get(
            "https://challenge-for-adventurers.herokuapp.com/data/" +
              id +
              "/supplies",
            resp => {
              let data = "";

              // A chunk of data has been recieved.
              resp.on("data", chunk => {
                data += chunk;
              });
              // The whole response has been received. Print out the result.
              resp.on("end", () => {
                supplies = JSON.parse(data);
                https
                  .get(
                    "https://challenge-for-adventurers.herokuapp.com/data/" +
                      id +
                      "/spents",
                    resp => {
                      let data = "";

                      // A chunk of data has been recieved.
                      resp.on("data", chunk => {
                        data += chunk;
                      });
                      // The whole response has been received. Print out the result.
                      resp.on("end", () => {
                        spents = JSON.parse(data);

                        var initDate = convertToDate(prices[0].date);
                        var finalDate = convertToDate(
                          prices[prices.length - 1].date
                        );

                        var currentDate = initDate;

                        while (currentDate < finalDate) {
                          var formatedDate =
                            (currentDate.getDate() >= 10
                              ? currentDate.getDate()
                              : "0" + currentDate.getDate()) +
                            "/" +
                            (currentDate.getMonth() + 1 >= 10
                              ? currentDate.getMonth() + 1
                              : "0" + (currentDate.getMonth() + 1)) +
                            "/" +
                            currentDate.getFullYear();

                          currentGas += calculateGasAmountByDay(formatedDate);

                          currentGas -= calculateCarsKmPerLiterByUsage(
                            formatedDate
                          );

                          finalResult.push({
                            date: formatedDate,
                            value: parseFloat(currentGas.toFixed(2))
                          });

                          var result = new Date(currentDate);
                          result.setDate(result.getDate() + 1);
                          currentDate = result;
                        }
                        console.log(finalResult);

                        request.post(
                          "https://challenge-for-adventurers.herokuapp.com/check?id=" +
                            id,
                          {
                            json: finalResult
                          },
                          (error, res, body) => {
                            if (error) {
                              console.error(error);
                              return;
                            }
                            console.log(`statusCode: ${res.statusCode}`);
                            console.log(body);
                          }
                        );
                      });
                    }
                  )
                  .on("error", err => {
                    console.log("Error: " + err.message);
                  });
              });
            }
          )
          .on("error", err => {
            console.log("Error: " + err.message);
          });
      });
    }
  )
  .on("error", err => {
    console.log("Error: " + err.message);
  });

function calculateGasAmountByDay(date) {
  var dayUsage = supplies.filter(function(supplie) {
    return supplie.date == date;
  });
  var value = 0.0;

  if (dayUsage.length > 0 && dayUsage[0].value && dayUsage[0].value > 0) {
    var priceOfDay = 0.0;

    prices.every(function(price) {
      if (convertToDate(price.date) <= convertToDate(dayUsage[0].date)) {
        priceOfDay = price.value;
        return true;
      }
      return false;
    });
    value = dayUsage[0].value / priceOfDay;
  }

  return value;
}

function calculateCarsKmPerLiterByUsage(date) {
  var daysUse = spents.filter(function(spent) {
    return spent.date == date;
  });

  var value = 0.0;
  if (daysUse.length > 0 && daysUse[0].value && daysUse[0].value > 0) {
    value = daysUse[0].value / 9;
  }
  return value;
}

function convertToDate(stringDate) {
  let parts = stringDate.split("/");
  var date = new Date(parts[2], parts[1] - 1, parts[0]);

  return date;
}
