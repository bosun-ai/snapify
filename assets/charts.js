// // var customColors = ['#2255FF', '#55FF22', '#FF2255', '#5522FF', '#FF5522'];

// function hslToHex(h, s, l) {
//     l /= 100;
//     const a = s * Math.min(l, 1 - l) / 100;
//     const f = n => {
//         const k = (n + h / 30) % 12;
//         const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
//         return Math.round(255 * color).toString(16).padStart(2, '0');
//     };
//     return `#${f(0)}${f(8)}${f(4)}`;
// }

// function stringToHash(str) {
//     return md5(str);
// }

// var countries = null;
// var categories = null;
// async function getCountriesCharts() {
//     var data = await unifiedSendRequest(STATSREPORTS);
//     countries = data['country'];
//     categories = data['categories'];
// }
// getCountriesCharts();


// function generateColors(totalKeys, totalValues){
//     // for the 
// }
// function generateColor(country, category, totalKeys, totalValues) {
//     if (Array.isArray(country) && country.length > 0) {
//         country = country[0];
//     }
//     if (Array.isArray(category) && category.length > 0) {
//         category = category[0];
//     }
//     var totalCountries = 5;
//     var countryIndex = -1;
//     // TODO what if column and label not category and country?
//     if (countries) {
//         totalCountries = countries.length;
//         countryIndex = countries.indexOf(country);
//     }
//     var totalCategories = 5;
//     var categoryIndex = -1;
//     if (categories) {
//         totalCategories = categories.length;
//         categoryIndex = categories.indexOf(category);
//     }
//     if (countryIndex === -1 || categoryIndex === -1) {
//         // Fallback for unknown country or category
//         const countryHash = parseInt(stringToHash(country), 16);
//         const categoryHash = parseInt(stringToHash(category), 16);
//         const hue = (categoryHash % 360 + 360) % 360;  // Ensure positive hue
//         const saturation = (countryHash % 100 + 100) % 100;  // Ensure positive saturation
//         return hslToHex(hue, saturation, 50);
//     }
//     const hueInterval = 360 / totalCountries;
//     const hue = hueInterval * countryIndex;
//     const saturationInterval = 100 / totalCategories;
//     const saturation = saturationInterval * (categoryIndex + 1);  // +1 to avoid 0 saturation
//     const lightness = 50;

//     return hslToHex(hue, saturation, lightness);
// }


// function generateHash(column, label) {
//     var hash = 0, i, chr;
//     const str = column + label;
//     for (i = 0; i < str.length; i++) {
//         chr   = str.charCodeAt(i);
//         hash  = ((hash << 5) - hash) + chr;
//         hash |= 0;  // Convert to 32bit integer
//     }
//     return Math.abs(hash);
// }

// function drawBarChart(ctx, data, columnName, headerText, chartTag, big=false) {

//     var dataCol;
//     if (Array.isArray(columnName) && columnName.length > 1) {
//         // If columnName is an array
//         dataCol = Object.entries(data).filter(([key, value]) => columnName.includes(key)).map(([key, value]) => ({ Type: key, Value: value }));
//     } else {
//         dataCol = Object.entries(data[columnName]).map(([key, value]) => ({ Type: key, Value: value }));
//     }
//     var labels = dataCol.map(d => d.Type);
//     var values = dataCol.map(d => d.Value);
//     var backgroundColors = labels.map(label => {
//         return generateColor(columnName, label, 1, labels.length);
//     });
//     let chartStatus = Chart.getChart(chartTag); // <canvas> id
//     var datasets = [{
//         label: headerText,
//         data: values,
//         backgroundColor: backgroundColors
//     }];
//     if (chartStatus != undefined) {
//         if (big) {
//             // big might have different chartType, so redraw it
//             chartStatus.destroy();
//         } else {
//             // chart already exists, so just update it with the new data
//             chartStatus.data.labels = labels;
//             chartStatus.data.datasets = datasets;
//             chartStatus.options.plugins.title.text = headerText;
//             chartStatus.update();
//             return true;
//         }
//     }
//     var legends = getLegend(big, datasets, labels);
//     var chart = new Chart(ctx, {
//           type: 'bar',
//           data: {
//             labels: labels,
//             datasets: datasets
//         },
//           options: {
//               responsive: true,
//               maintainAspectRatio: false,
//               scales: {
//                   x: {
//                       beginAtZero: true,
//                   },
//                   y: {
//                       beginAtZero: true
//                   }
//               },
//               plugins: {
//                   title: {
//                       display: true,
//                       text: ''
//                   },
//                   htmlLegend: legends[0],
//                   legend: legends[1],
//                 }
//             },
//             plugins: [htmlLegendPlugin],
//         }
//     );

//     chart.options.plugins.title.text = headerText;
//      // Listen to the contextmenu event on the canvas
//     //  ctx.addEventListener('contextmenu', function() {
//     //     // Toggle the display property of datalabels
//     //     chart.options.plugins.datalabels.display = !chart.options.plugins.datalabels.display;
//     //     chart.update();
//     // });
//     chart.update();
//     return true;
// }

// var months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// function getLegendText(d) {
//     // Use only the last part of the columnName as the legend text
//     var parts = d.split('.');
//     var monthNumber = parseInt(parts[parts.length - 2], 10);
//     return months[monthNumber];
// }
// function drawMultiBarChart(ctx, dataObj, columnNames, headerText, chartTag, big=false) { // TODO only accepts 1 columnName (metric)
//     dataObj = dataObj[columnNames[0]];
//     columnNames = Object.keys(dataObj);
//     let allHaveSingleKey = columnNames.every(columnName => {
//         return Object.keys(dataObj[columnName]).length == 1;
//     });
    
//     if (allHaveSingleKey && columnNames.length == 1) {
//         // At least one dataObj[columnName] has more or less than one key
//         return false;
//     }
    
//     var labels = Object.keys(dataObj[columnNames[0]]);
//     var datasets = columnNames.map((colName, index) => {
//         var keys = Object.keys(dataObj[colName]);
//         var data = labels.map(label => dataObj[colName][label]);
//         var backgroundColors = labels.map(label => {
//             return generateColor(colName, label, columnNames.length, labels.length);
//         });
//         return {
//             label: colName,
//             data: data,
//             backgroundColor: backgroundColors  
//         };
//     });

//     let chartStatus = Chart.getChart(chartTag); // <canvas> id
//     if (chartStatus != undefined) {
//         if (big) {
//             // big might have different chartType, so redraw it
//             chartStatus.destroy();
//         } else {
//             // chart already exists, so just update it with the new data
//             chartStatus.data.labels = labels;
//             chartStatus.data.datasets = datasets;
//             chartStatus.options.plugins.title.text = headerText;
//             chartStatus.update();
//             return true;
//         }
//     }
//     var legends = getLegend(big, datasets, labels);
//     var chart = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: labels,
//             datasets: datasets
//         },
//         options: {
//             responsive: true,
//             plugins: {
//                 title: {
//                     display: true,
//                     text: headerText
//                 },
//                 htmlLegend: legends[0],
//                 legend: legends[1],
//             },
//             maintainAspectRatio: false,
//             scales: {
//                 x: {
//                     beginAtZero: true
//                 },
//                 y: {
//                     beginAtZero: true
//                 }
//             }
//         },
//         plugins: [htmlLegendPlugin],
//     });
//     return true;
// }

// function drawStackedBarChart(ctx, dataObj, columnNames, headerText, chartTag,big=false) {
//     let allHaveSingleKey = columnNames.every(columnName => {
//         return Object.keys(dataObj[columnName]).length == 1;
//     });
    
//     if (allHaveSingleKey) {
//         // At least one dataObj[columnName] has more or less than one key
//         return false;
//     }
//     columnNames = columnNames[0];
//     dataObj = dataObj[columnNames];
//     columnNames = Object.keys(dataObj);
//     var labels = Object.keys(dataObj[columnNames[0]]);
//     var datasets = columnNames.map((colName, index) => {
//         var data = labels.map(label => dataObj[colName][label]);
//         var backgroundColors = labels.map(label => {
//             return generateColor(colName, label, columnNames.length, labels.length);
//         });
//         return {
//             label: colName,
//             data: data,
//             backgroundColor: backgroundColors
//         };
//     });
//     var labelsShown = labels.map(label => label);

//     let chartStatus = Chart.getChart(chartTag); // <canvas> id
//     if (chartStatus != undefined) {
//         if (big) {
//             // big might have different chartType, so redraw it
//             chartStatus.destroy();
//         } else {
//             // chart already exists, so just update it with the new data
//             chartStatus.data.labels = labelsShown;
//             chartStatus.data.datasets = datasets;
//             chartStatus.options.plugins.title.text = headerText;
//             // TODO should the getLegend be updated here
//             chartStatus.update();
//             return true;
//         }
//     }
//     var legends = getLegend(big, datasets, labelsShown);

//     var chart = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: labelsShown,
//             datasets: datasets
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 title: {
//                     display: true,
//                     text: headerText
//                 },
//                 htmlLegend: legends[0],
//                 legend: legends[1],
//             },
//             scales: {
//                 x: {
//                     beginAtZero: true,
//                     stacked: true   // Set stacked to true
//                 },
//                 y: {
//                     beginAtZero: true,
//                     stacked: true   // Set stacked to true
//                 }
//             }
//         },
//         plugins: [htmlLegendPlugin],
//     });
//     // attachListeners(chart);
//     return true;
// }


// function drawLineChart(ctx, dataObj, columnName, headerText, chartTag, big=false) {
//     var data;
//     if (Array.isArray(columnName) && columnName.length > 1) {
//         // If columnName is an array
//         data = Object.entries(dataObj).filter(([key, value]) => columnName.includes(key)).map(([key, value]) => ({ Type: key, Value: value }));
//     } else {
//         // Original logic
//         if (Object.keys(dataObj[columnName]).length == 1) {
//             return false;
//         }
//         data = Object.entries(dataObj[columnName])
//         .map(([key, value]) => ({ Type: key, Value: value }));
//     }
//     var labels = data.map(d => d.Type);
//     var backgroundColors = labels.map(label => {
//         return generateColor(columnName, label, 1, labels.length);
//     });
//     let chartStatus = Chart.getChart(chartTag); // <canvas> id
//     if (chartStatus != undefined) {
//         if (big) {
//             // big might have different chartType, so redraw it
//             chartStatus.destroy();
//         } else {
//             // chart already exists, so just update it with the new data
//             chartStatus.data.labels = labels;
//             chartStatus.data.datasets[0].data =  data.map(d => d.Value);
//             chartStatus.options.plugins.title.text = headerText;
//             chartStatus.update();
//             return true;
//         }
//     }
//     var datasets = [{
//         label: columnName,
//         data: data.map(d => d.Value),
//         borderColor: 'blue',
//         fill: 'blue',
//         pointStyle: 'line'
//     }]
//     var legends = getLegend(big, datasets, []);
//     var ylabel = 'Weight (kg)';
//     if (columnName[0].includes('Amount')){
//         ylabel = 'Amount';
//     }
//     var chart = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: labels,
//             datasets: datasets
//         },
//         options: {
//             responsive: true,
//             plugins: {
//                 title: {
//                     display: true,
//                     text: headerText
//                 },
//                 htmlLegend: legends[0],
//                 legend: legends[1],
//             },
//             scales: {
//                 x: {
//                     beginAtZero: true
//                 },
//                 y: {
//                     beginAtZero: true,
//                     title: {
//                         display: true,
//                         text: ylabel
//                     }
//                 }
//             }
//         },
//         plugins: [htmlLegendPlugin],
//     });
//     return true;
// }


// function drawPieChart(ctx, dataObj, columnName, headerText, chartTag, big=false) {
//     let dataArr;
//     if (Array.isArray(columnName) && columnName.length > 1) {
//         // If columnName is an array
//         dataArr = Object.entries(dataObj).filter(([key, value]) => columnName.includes(key)).map(([key, value]) => ({ Type: key, Value: value }));
//     } else {
//         // Original logic
//         if (Object.keys(dataObj[columnName]).length == 1) {
//             return false;
//         }

//         dataArr = Object.entries(dataObj[columnName])
//             .filter(([key, value]) => !key.includes("Total"))
//             .map(([key, value]) => ({ Type: key, Value: value }));
//     }
//     dataArr.sort((a, b) => b.Value - a.Value);
//     var labels = dataArr.map(d => d.Type);
//     var backgroundColors = labels.map(label => {
//         return generateColor(columnName, label, 1, labels.length);
//     });
//     let chartStatus = Chart.getChart(chartTag); // <canvas> id
//     if (chartStatus != undefined) {
//         if (big) {
//             // big might have different chartType, so redraw it
//             chartStatus.destroy();
//         } else {
//             // chart already exists, so just update it with the new data
//             chartStatus.data.labels = labels;
//             chartStatus.data.datasets[0].data =  dataArr.map(d => d.Value);
//             chartStatus.options.plugins.title.text = headerText;
//             chartStatus.update();
//             return true;
//         }
//     }
//     console.log(backgroundColors);
//     var datasets = [{
//         data: dataArr.map(d => d.Value),
//         backgroundColor: backgroundColors,
//         borderColor: backgroundColors
//     }]
    
//     // let totalValue = dataArr.reduce((acc, curr) => acc + curr.Value, 0);
//     // dataArr = dataArr.filter(d => d.Value / totalValue > 0.01);
//     var canvasWidth = ctx.offsetWidth;  // Get the canvas width
//     var paddingValue = 0.25 * canvasWidth; // Calculate 25% of the width
//     var legends = getLegend(big, datasets, []);
//     var chart = new Chart(ctx, {
//         type: 'pie',
//         data: {
//             labels: labels,
//             datasets: datasets
//         },
//         options: {
//             responsive: true,
//             plugins: {
//                 title: {
//                     display: true,
//                     text: headerText
//                 },
//                 htmlLegend: legends[0],
//                 legend: legends[1],
//             }
//         },
//         plugins: [htmlLegendPlugin],
//     });
//     ctx.style.height = paddingValue * 2 + "px";
//     ctx.style.marginLeft = 'auto';
//     ctx.style.marginRight = 'auto';
//     return true;
// }


// function drawScatterChart(ctx, data, columnName, headerText, chartTag, big=false) {
//     console.log(data);
//     console.log(columnName);
//     var dataCol;
//     if (Array.isArray(columnName) && columnName.length > 1) {
//         // If columnName is an array
//         dataCol = Object.entries(data).filter(([key, value]) => columnName.includes(key)).map(([key, value]) => ({ x: key, y: value }));
//     } else {
//         dataCol = Object.entries(data[columnName]).map(([key, value]) => ({ x: key, y: value }));
//     }
//     console.log(dataCol);
//     var labels = dataCol.map(d => d.Type);
//     var values = dataCol.map(d => d.Value);
//     var backgroundColors = labels.map(label => {
//         return generateColor(columnName, label, 1, labels.length);
//     });
//     var dataPoints = Object.keys(data[columnName[0]]).map(key => {
//         return {
//             x: data[columnName[1]][key],
//             y: data[columnName[0]][key],
//             label: key // Name of the product, e.g., 'prod1'
//         };
//     });
//     let chartStatus = Chart.getChart(chartTag); // <canvas> id
//     var datasets = [{
//         label: headerText,
//         data: dataPoints,
//         backgroundColor: 'rgba(0, 123, 255, 0.5)', // Example color, adjust as needed
//         pointBorderColor: 'rgba(0, 123, 255, 1)', // Example border color
//         pointRadius: 5 // Adjust the point size if needed
//     }];
//     if (chartStatus != undefined) {
//         if (big) {
//             // big might have different chartType, so redraw it
//             chartStatus.destroy();
//         } else {
//             // chart already exists, so just update it with the new data
//             chartStatus.data.datasets = datasets;
//             chartStatus.options.plugins.title.text = headerText;
//             chartStatus.update();
//             return true;
//         }
//     }
//     var legends = getLegend(big, datasets, []);
//     var chart = new Chart(ctx, {
//           type: 'scatter',
//           data: {
//             datasets: datasets
//         },
//           options: {
//               responsive: true,
//               maintainAspectRatio: false,
//               scales: {
//                   x: {
//                     type: 'linear',
//                     position: 'bottom',
//                     beginAtZero: true,
//                     title: {
//                         display: true,
//                         text: 'Amount Sold'
//                     }
//                   },
//                   y: {
//                       beginAtZero: true,
//                       title: {
//                         display: true,
//                         text: 'Total Weight (kg)'
//                     }
//                   }
//               },
//               plugins: {
//                   title: {
//                       display: true,
//                       text: headerText
//                   },
//                   htmlLegend: legends[0],
//                   legend: legends[1],
//                   tooltip: {
//                     callbacks: {
//                         label: function(context) {
//                             var labelLines = [`${context.raw.label}:` || '', `Total Paper Weight: ${context.raw.y.toFixed(3)}kg`, `Amount:${context.raw.x}`]

//                             return labelLines;
//                         }
//                     }
//                 }
//                 }
//             },
//             plugins: [htmlLegendPlugin],
//         }
//     );

//     chart.update();
//     return true;
// }


// function handleHover(evt, item, legend) {
//     legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
//         colors[index] = index === item.index || color.length === 9 ? color : color + '4D';
//     });
//     legend.chart.update();
//   }

// function handleHoverLeave(evt, item, legend) {
//     legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
//         colors[index] = color.length === 9 ? color.slice(0, -2) : color;
//     });
//     legend.chart.update();
// }

// const getOrCreateLegendList = (chart, id) => {
//     const legendContainer = document.getElementById(id);
//     let listContainer = legendContainer.querySelector('ul');
  
//     if (!listContainer) {
//       listContainer = document.createElement('ul');
//     //   listContainer.style.display = 'flex';
//     //   listContainer.style.flexDirection = 'row';
//       listContainer.style.marginTop = '20px';
//       listContainer.style.padding = 0;
  
//       legendContainer.appendChild(listContainer);
//     }
  
//     return listContainer;
//   };
  
//   const htmlLegendPlugin = {
//     id: 'htmlLegend',
//     afterUpdate(chart, args, options) {
//       const ul = getOrCreateLegendList(chart, options.containerID);
  
//       // Remove old legend items
//       while (ul.firstChild) {
//         ul.firstChild.remove();
//       }
  
//       if(!chart.options.plugins.htmlLegend.labelItems) {
//       // Reuse the built-in legendItems generator
//         var items = chart.options.plugins.legend.labels.generateLabels(chart);
//         var columns = options.columns;
//         var allItems = {};
//         items.forEach((item, itemIndex) => {
//             const groupDiv = document.createElement('div');
//             groupDiv.classList.add('legend-group');
//             ul.appendChild(groupDiv);
//             var subUl = document.createElement('ul');
//             // Create and append the group header
//             const groupHeader = createLegendLiElement(chart, item, options.bigMode);
//             groupDiv.appendChild(groupHeader);
//             allItems[itemIndex] = {header: item, subItems: []};
//             if (columns) {
//                 columns.forEach((column, columnIndex) => {
//                     var subItem = {'text': `${columns[columnIndex]} - ${parseFloat(chart.data.datasets[itemIndex].data[columnIndex]).toFixed(3)}`,
//                                 'fillStyle': chart.data.datasets[itemIndex].backgroundColor[columnIndex],
//                                 'fontColor': item.fontColor, 'hidden': false, 'lineWidth': item.lineWidth,
//                                 'strokeStyle': item.strokeStyle, 'datasetIndex': itemIndex, 'columnIndex': columnIndex,
//                                 'originalData': options.originalData}
//                     var li = createLegendLiElement(chart, subItem, options.bigMode);
//                     subUl.appendChild(li);
//                     allItems[itemIndex].subItems.push(subItem);
//                 });
//                 // groupHeader.onclick = () => {
//                 //     const subitemsVisible = groupDiv.classList.toggle('expanded');
//                 //     Array.from(groupDiv.children).forEach((child, index) => {
//                 //         if (index > 0) {  // Skip the group header
//                 //             child.style.display = subitemsVisible ? 'block' : 'none';
//                 //         }
//                 //     });
//                 // };
//             } 
//             groupDiv.appendChild(subUl);
//         });
//         chart.options.plugins.htmlLegend.labelItems = allItems;
//     } else {
//         var itemsDict = chart.options.plugins.htmlLegend.labelItems;
//         Object.keys(itemsDict).forEach(datasetIndex => {
//             const groupDiv = document.createElement('div');
//             groupDiv.classList.add('legend-group');
//             ul.appendChild(groupDiv);
            
//             const groupHeader = createLegendLiElement(chart, itemsDict[datasetIndex].header, options.bigMode);
//             groupDiv.appendChild(groupHeader);
            
//             var subUl = document.createElement('ul');
//             groupDiv.appendChild(subUl);
            
//             itemsDict[datasetIndex].subItems.forEach(subItem => {
//                 var li = createLegendLiElement(chart, subItem, options.bigMode);
//                 subUl.appendChild(li);
//             });
//         });
//     }
//     }
//   };

// function createLegendLiElement(chart, item, big){
//         const li = document.createElement('li');
//         li.style.alignItems = 'center';
//         li.style.cursor = 'pointer';
//         li.style.display = 'flex';
//         li.style.flexDirection = 'row';
//         li.style.marginLeft = '10px';
//         li.style.marginBottom = '0.4rem';
//         // TODO enable for hover mechanic
//         // li.setAttribute('data-item', JSON.stringify(item));
//         if (item.columnIndex == null) {
//             li.classList.add('group-header');
//         }
        
//         li.onclick = () => {
//           if(big){ // only do this in the big window mode, otherwise different charts may interact with each other
//             updateTable(item);
//           }
//           const {type} = chart.config;
//           if (type === 'pie' || type === 'doughnut') {
//             // Pie and doughnut charts only have a single dataset and visibility is per item
//             chart.toggleDataVisibility(item.index);
//             item.hidden = !item.hidden;
//           } else {
//             // chart.data.datasets[item.datasetIndex].data[item.columnIndex].hidden = true;
//             // chart.hide(item.datasetIndex, item.columnIndex);
//             const index = item.datasetIndex;
//             // if (chart.isDatasetVisible(index) {
            
//             if (!item.hidden) {
//                 if(item.columnIndex !== undefined){
//                     chart.data.datasets[item.datasetIndex].data[item.columnIndex] = 0;
//                 } else {
//                     chart.hide(index);
//                 }
//               item.hidden = true;
//             } else {
//                 if(item.columnIndex !== undefined){
//                     chart.data.datasets[item.datasetIndex].data[item.columnIndex] = item.originalData[item.datasetIndex].data[item.columnIndex];
//                 } else {
//                     chart.show(index);
//                 }
//               item.hidden = false;
//             }
//           }
//           chart.update();
//         };
//         // Color box
//         const boxSpan = document.createElement('span');
//         var legendColor = item.fillStyle;
//         var {type} = chart.config;
//         if (type === 'line') {
//             // for linecharts the color is of the line instead of the filling
//             legendColor = item.strokeStyle;
//         }
//         boxSpan.style.background = legendColor;
//         boxSpan.style.borderColor = item.strokeStyle;
//         boxSpan.style.borderWidth = item.lineWidth + 'px';
//         boxSpan.style.display = 'inline-block';
//         boxSpan.style.flexShrink = 0;
//         boxSpan.style.height = '20px';
//         boxSpan.style.marginRight = '10px';
//         boxSpan.style.width = '20px';
  
//         // Text
//         const textContainer = document.createElement('p');
//         textContainer.style.color = item.fontColor;
//         textContainer.style.margin = 0;
//         textContainer.style.padding = 0;
//         textContainer.style.textDecoration = item.hidden ? 'line-through' : '';
  
//         const text = document.createTextNode(item.text);
//         textContainer.appendChild(text);
  
//         li.appendChild(boxSpan);
//         li.appendChild(textContainer);
//         return li;
// }

// function attachListeners(chart) {
//     // TODO the mouseout is not working as chart.update refreshes the li list
//     const ul = document.getElementById('legend-container');
//     ul.querySelectorAll('li').forEach(li => {
//         li.addEventListener('mouseover', (evt) => {
//             const item = JSON.parse(li.getAttribute('data-item'));
//             chart.data.datasets.forEach((dataset, datasetIndex) => {
//                 dataset.backgroundColor.forEach((color, index, colors) => {
//                     colors[index] = index === item.columnIndex && datasetIndex === item.datasetIndex || color.length === 9 ? color : color + '4D';
//                 });
//             });
//             chart.update();
//         });
//         li.addEventListener('mouseleave', (evt) => {
//             chart.data.datasets.forEach(dataset => {
//                 dataset.backgroundColor.forEach((color, index, colors) => {
//                     colors[index] = color.length === 9 ? color.slice(0, -2) : color;
//                 });
//             });
//             chart.update();
//         });
//     });
// }

// function getLegend(big, datasets, labels) {
//     var htmlLegend = null;
//     var legend = {
//         display: false,
//     };
//     if (big) {
//         htmlLegend = {
//             // ID of the container to put the legend in
//             containerID: 'legend-container',
//             columns: labels,
//             originalData: JSON.parse(JSON.stringify(datasets)),
//             labelItems: null,
//             bigMode: big
//         }
//     } else {
//         legend = {
//             display: true,
//             position: 'top',
//             labels: {color: 'black', pointStyle: 'line', usePointStyle: true}
//         }
//     }
//     return [htmlLegend, legend];
// }