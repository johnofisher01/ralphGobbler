
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs')
var http = require('http');
var postbackhost = "track.agencytrackers.com";
const XLSX = require('xlsx');

  function convertXSLsToCSV(path){
    fs.readdirSync(path).filter(function (subdirectory) {
        if (fs.statSync(path+'/'+subdirectory).isDirectory() && subdirectory!="node_modules" && subdirectory!= ".vscode" && subdirectory!= ".tmp.drivedownload")
        {
          fs.readdirSync(path+'/'+subdirectory).filter(function (file) {
            if (file.split(".")[file.split(".").length-1] == "xls") //contains for both xls and xlsx
            {
              var workbook = XLSX.readFile(path + "/" + subdirectory + "/" + file);
              XLSX.writeFile(workbook, path + "/" + subdirectory + "/" + file + ".csv", {booktype: "csv"});
            }
          });
        }
    });
  }
  function traverseDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
        if (fs.statSync(path+'/'+file).isDirectory() && file!="node_modules" && file!= ".vscode" && file!= ".tmp.drivedownload" 
		)
        {
            // console.log("DIRECTORY:" + path+'/'+file);
            var config = getConfigFile(path+'/'+file);
            console.log("firing postbacks for" + path+'/'+file);
            readExcelFilesAndFirePostbacks(config, path+'/'+file);
        }
    });
  }

  function getConfigFile(path) {
    var rawConfigFile = fs.readFileSync(path+'/config.json');
    var config = JSON.parse(rawConfigFile);
    return config;
  }

  function readExcelFilesAndFirePostbacks(config, path){
    fs.readdirSync(path).filter(function (file) {
        if (file.split(".")[file.split(".").length-1] == "csv")
        {
            console.log("processing" + file)
            fs.createReadStream(path+'/'+file)
                .pipe(csv())
                .on('data', (row) => {

                    row[config.cid_ColumnHeader] = stripQuotesAndAdditionalSpaces(row[config.cid_ColumnHeader]);
                    row[config.FTD_ColumnHeader_For_False_0_or_blank_FTD_Rows_To_Ignore] = stripQuotesAndAdditionalSpaces(row[config.FTD_ColumnHeader_For_False_0_or_blank_FTD_Rows_To_Ignore]);
                    if (row[config.cid_ColumnHeader] != "")
                    {
                        if (row[config.FTD_ColumnHeader_For_False_0_or_blank_FTD_Rows_To_Ignore] !== ""
                        &&  row[config.FTD_ColumnHeader_For_False_0_or_blank_FTD_Rows_To_Ignore] !== "false"
                        &&  row[config.FTD_ColumnHeader_For_False_0_or_blank_FTD_Rows_To_Ignore] !== "False"
                        &&  row[config.FTD_ColumnHeader_For_False_0_or_blank_FTD_Rows_To_Ignore] !== "0"
                        )
                        {
                            var querystringpart = "&cid=" + config.appendAllAnidsWith + row[config.cid_ColumnHeader];
                            console.log("postback firing to " + "https://track.agencytrackers.com/postback?" + querystringpart);
                            firePostBack(querystringpart);
                        }
                    }
                    
                })
                .on('end', () => {
                    console.log('CSV file successfully processed');
                });
        }
        
    });
  }

  function firePostBack(querystringpart){
    var options = {
        host: postbackhost,
        path: "/postback?" + querystringpart
      };

      callback = function(response) {
        var str = '';
      
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
          str += chunk;
        });
      
        //the whole response has been received, so we just print it out here
        response.on('end', function () {
           console.log(str);
        });
      }
      http.request(options, callback).end();
  }

  function stripQuotesAndAdditionalSpaces(csvCell){
    if (csvCell){
      while (csvCell.includes('"'))
      {
        csvCell = csvCell.replace('"', '');
      }
      while (csvCell.includes(' ')){
        csvCell = csvCell.replace(' ', '');
      }
    }
    return csvCell;
  }


convertXSLsToCSV(".");
traverseDirectories(".");