function updateChartNew(chartData, chartCanvas, titleId=false, bigmode=false, setTitle=false) {
    var dataObj = chartData['data'];
    var columnNamesX = chartData['xColumns'];
    var columnNamesXOutput = chartData['xColumns'].map(x => convertStringFormat(x));
    var columnNamesY = chartData['yColumns'];
    var columnNamesYOutput = chartData['yColumns'].map(x => {
        if (chartData['yUnits'] && chartData['yUnits'][x] && chartData['yUnits'][x] != 'other') {
            return convertStringFormat(x) + ' (' + chartData['yUnits'][x] + ')';
        } else {
            return convertStringFormat(x);
        }
    });
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
    chartCanvas.data.labels = subGroupList;
    chartCanvas.data.datasets = datasets;
    var title = columnNamesYOutput.join(" - ") + ' per ' + columnNamesXOutput.join(" per ");
    if (setTitle) {
        title = setTitle;
    }
    if (titleId) {
        document.getElementById(titleId).innerText = title;
        chartCanvas.options.plugins.title.display = false;
        chartCanvas.config.options.scales.x.title.text = shortenTitle(columnNamesXOutput.join(" per "), bigmode);
        chartCanvas.config.options.scales.y.title.text = shortenTitle(columnNamesYOutput.join(" - "), bigmode);
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
    
    // Configure tooltip to include units
    if (!chartCanvas.options.plugins.tooltip) {
        chartCanvas.options.plugins.tooltip = {};
    }
    chartCanvas.options.plugins.tooltip.callbacks = {
        ...chartCanvas.options.plugins.tooltip.callbacks,
        label: function(context) {
            let label = context.dataset.label || '';
            // Handle different chart types - get y value, or use the raw value
            let value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            let unit = '';
            
            // Try to find the unit for this dataset
            // First, try to match by exact label
            if (chartData['yUnits'] && chartData['yUnits'][label]) {
                unit = chartData['yUnits'][label];
            } else {
                // Try to find by matching the converted label with yColumns
                for (let yCol of columnNamesY) {
                    if (convertStringFormat(yCol) === label && chartData['yUnits'] && chartData['yUnits'][yCol]) {
                        unit = chartData['yUnits'][yCol];
                        break;
                    }
                }
            }
            
            // If no unit found and there's only one y column, use its unit
            if (!unit && columnNamesY.length === 1 && chartData['yUnits'] && chartData['yUnits'][columnNamesY[0]]) {
                unit = chartData['yUnits'][columnNamesY[0]];
            }
            
            // Format the label with unit
            if (unit && value !== undefined && value !== null && unit != 'other') {
                return label + ': ' + value + ' ' + unit;
            } else if (value !== undefined && value !== null) {
                return label + ': ' + value;
            } else {
                return label;
            }
        }
    };
    
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
