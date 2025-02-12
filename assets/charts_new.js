function updateChartNew(chartData, chartCanvas, titleId=false, bigmode=false, setTitle=false) {
    var dataObj = chartData['data'];
    var columnNamesX = chartData['xColumns'];
    var columnNamesXOutput = chartData['xColumns'].map(x => convertStringFormat(x));
    var columnNamesY = chartData['yColumns'];
    var columnNamesYOutput = chartData['yColumns'].map(x => convertStringFormat(x));

    var mainGroupList = chartData[columnNamesX[0]];
    var subGroupList = chartData[columnNamesX[1]];
    var datasets;
    if(subGroupList !== undefined) {
        datasets = mainGroupList.map(mainGroup => {
            var data = subGroupList.map(subGroup => dataObj[mainGroup][subGroup] || 0);
            return {
                label: mainGroup,
                data: data
            };
        })
    } else {
        subGroupList = [];
        datasets = columnNamesY.map(yAxis => {
            return {
                label: convertStringFormat(yAxis),
                data: dataObj[yAxis],
            };
        })
    }
    // datasets = createDatasets(dataObj);
    console.log("Got datasets");
    console.log(datasets);
    chartCanvas.data.labels = subGroupList;
    chartCanvas.data.datasets = datasets;
    var title = columnNamesYOutput.join(" - ") + ' per ' + columnNamesXOutput.join(" per ");
    if (setTitle) {
        title = setTitle;
    }
    if (titleId) {
        document.getElementById(titleId).innerText = title;
    } else {
        chartCanvas.config.options.scales.x.title.text = shortenTitle(columnNamesXOutput.join(" per "), bigmode);
        chartCanvas.config.options.scales.y.title.text = shortenTitle(columnNamesYOutput.join(" - "), bigmode);
        chartCanvas.options.plugins.title.text = title;
    }

    if (datasets.length > 5) {
        chartCanvas.options.plugins.legend.display = false;
    } else {
        chartCanvas.options.plugins.legend.display = true;
    }
    chartCanvas.update();
  }

  function parseAndSortData(dataObj) {
    // This function will attempt to convert each key into a Date object. If it fails, the key is used as is.
    return Object.entries(dataObj)
      .map(([key, value]) => {
        let parsedKey = Date.parse(key) ? new Date(key) : key;
        return { key: parsedKey, value };
      })
      // Sort by key, checking if key is a date
      .sort((a, b) => {
        if (a.key instanceof Date && b.key instanceof Date) {
          return a.key - b.key;
        } else {
          return a.key.localeCompare(b.key);
        }
      });
  }

function createDatasets(dataObj) {
    // Parse and sort each group's data
    const parsedData = {};
    for (const group in dataObj) {
        parsedData[group] = parseAndSortData(dataObj[group]);
    }

    // Create datasets for Chart.js
    const datasets = Object.keys(parsedData).map(group => {
        return {
        label: group,
        data: parsedData[group].map(item => ({
            x: item.key instanceof Date ? item.key : new Date(item.key).toISOString(), // Chart.js expects a date string for the x axis
            y: item.value
        }))
        };
    });

    return datasets;
}

function drawLineChartNew(chartElement) {
    chartElement.config.type = 'line';
    chartElement.update();
} 

function drawScatterChartNew(chartElement) {
    chartElement.config.type = 'scatter';
    chartElement.update();
}

function drawBarChartNew(chartElement) {
    chartElement.config.type = 'bar';
    chartElement.update();
}

function drawPieChartNew(chartElement) {
    chartElement.config.type = 'pie';
    chartElement.update();
}

function shortenTitle(title, bigmode=false, maxLength = 30) {
    if (!bigmode && title.length > maxLength) {
        const prefix = title.substr(0, 12); // Get beginning part of the title
        const suffix = title.substr(title.length - 12); // Get ending part of the title
        return `${prefix}...${suffix}`; // Return modified title
    }
    return title; // Return original title if it's short enough
}
