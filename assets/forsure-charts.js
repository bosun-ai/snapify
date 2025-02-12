
function generalCharts() {

    // no required input
          let possibleCharts = {
            "YyEF2R6Wxcamq7Rs": {
              endpoint: "stats/next_reports/",
              chartType: populateNextReports,
              chartTag: "nextReportsChart",
              widgetId: "widgetAlwaysFirst",
              nocanvas: true,
              chartId: "nextReportsChart",
              widgetStyle: "font-weight: bold",
              chartTitle: "Reports due",
              requestSpecificReport: false,
              requestMethod: "GET"
            }
          }
          for (let key in possibleCharts) {
            possibleCharts[key].chartUUID = key;
          }
          return possibleCharts;
        }
    
        function countrySpecific() { // charts to show details about one country
          let countryFormData = null;
          let country = document.getElementById("countries").value;
          if (country) {
            countryFormData = new FormData();
            countryFormData.append("country", country);
          }
          console.log(countryFormData);
          let possibleCharts = { // Total costs per report, stacked bar chart with x = month, stacks = categories
            "xfdKfjo1XUkDlZRJ": {
              endpoint: "stats/prices/",
              chartType: drawStackedBarChart,
              chartTitle: "Costs (€)",
              requestSpecificReport: false,
              requestFormData: countryFormData
            }
    
          }
          for (let key in possibleCharts) {
            possibleCharts[key].chartUUID = key;
          }
          return possibleCharts;
        }
    
        function categorySpecific() { // charts to show details about one country
          let reportName = new FormData();
          let country = document.getElementById("countries").value;
          let stat_type = document.getElementById("columnsDropdown").value || "Batteries";
          if (country) {
            reportName.append("country_id", country);
          }
          if (columnsDropdown) {
            reportName.append("stat_type", stat_type);
          }
          console.log(reportName);
          let possibleCharts = {
            "sUzwhgnmliYc0Il5": {
              endpoint: "stats/hist",
              chartType: drawMultiBarChart,
              chartTitle: stat_type + " sold over time",
              requestSpecificReport: false,
              requestFormData: reportName
            },
            "pTqzFsNr1iIfaSHA": {
              endpoint: "stats/category/",
              chartType: drawPieChart,
              columnNames: "Amount Total",
              chartTitle: stat_type + " Amount Total",
              requestSpecificReport: true,
              requestFormData: reportName
            },
            "6sNfpvdCWfBFF6q6": {
              endpoint: "stats/category/",
              chartType: drawPieChart,
              columnNames: "Amount B2B",
              chartTitle: stat_type + " Amount B2B",
              requestSpecificReport: true,
              requestFormData: reportName
            },
            "plYFaOyqGGNSLEHD": {
              endpoint: "stats/category/",
              chartType: drawPieChart,
              columnNames: "Amount B2C",
              chartTitle: stat_type + " Amount B2C",
              requestSpecificReport: true,
              requestFormData: reportName
            },
            "pxWfg4wEKjUan8wJ": {
              endpoint: "stats/category/",
              chartType: drawPieChart,
              columnNames: "Weight Total (kg)",
              chartTitle: stat_type + " Weight Total (kg)",
              requestSpecificReport: true,
              requestFormData: reportName
            },
            "CAcM2ekUTyO93dvD": {
              endpoint: "stats/category/",
              chartType: drawPieChart,
              columnNames: "Weight B2B (kg)",
              chartTitle: stat_type + " Weight B2B (kg)",
              requestSpecificReport: true,
              requestFormData: reportName
            },
            "Ymu1atNIEPcg434d": {
              endpoint: "stats/category/",
              chartType: drawPieChart,
              columnNames: "Weight B2C (kg)",
              chartTitle: stat_type + " Weight B2C (kg)",
              requestSpecificReport: true,
              requestFormData: reportName
            }
          }
          for (let key in possibleCharts) {
            possibleCharts[key].chartUUID = key;
          }
          return possibleCharts;
        }
    
    // define all possible charts
        function getPossibleCharts() {
          let possibleCharts = {
    
            // Note that changing the ids here might mess things up as the pinning is stored in the backend
            ... generalCharts(),
            ... countrySpecific(),
            ... categorySpecific(),
    
    // packaging
            "FLtWKvERjJYJlHFp": {
              endpoint: "stats/packaging/",
              chartType: drawBarChart,
              columnNames: "Weight B2B (kg)"
            },
            "53UFq6Nzf71rzVkq": {
              endpoint: "stats/packaging/",
              chartType: drawPieChart,
              columnNames: "Weight B2B (kg)"
            },
            "Vi0Ul1Ks174BXuXY": {
              endpoint: "stats/packaging/",
              chartType: drawPieChart,
              columnNames: "Weight B2B (kg)"
            }
          }
          for (let key in possibleCharts) {
            possibleCharts[key].chartUUID = key;
          }
          return possibleCharts;
        }