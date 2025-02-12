let metric = [
    'Amount Total',
    'Amount B2B',
    'Amount B2C',
    'Weight Total (kg)',
    'Weight B2B (kg)',
    'Weight B2C (kg)'
]


async function getPinnedCharts() {
    try {
        var availableCharts = await unifiedSendRequest(GETPINNEDCHARTS, {method: 'GET'});
        return availableCharts; // TODO filtering
    } catch (error) {
        console.error(error.message);
        return {};
    }
}

async function drawCharts(charts, containerId, hard) {
    let emptyCharts = {};
    var reportsDue = createCanvasElement('widgetReportsDue');
    reportsDue.classList.add('reportsDueWidget');
    document.getElementById(containerId).appendChild(reportsDue);
    getReportsDue('widgetReportsDue').then(async (result) => {
        createReportsDueWidget(result);
    })
    for (let i = 0; i < charts.length; i++) {
        var widgetDivId = `widget${charts[i]['id']}`;
        if (hard || widgetChartParams[widgetDivId] === undefined) {
            var widget = createCanvasElement(widgetDivId);
            document.getElementById(containerId).appendChild(widget);
            var emptyChart = createEmptyChartDraw(`chart${widgetDivId}`);
            emptyCharts[i] = emptyChart;
        } else {
            emptyCharts[i] = widgetChartParams[widgetDivId].emptyChart;
        }
        
        // createPlaceholder(widgetDivId, containerId);
    }
    for (let i = 0; i < charts.length; i++) {
        widgetDivId = `widget${charts[i]['id']}`;
        getData(charts[i], emptyCharts[i], widgetDivId).then(async (result) => {
            fillPlaceholder(result);
        });
      }
}

// async function createPlaceholder(widgetDivId, containerId) {
//     // Create placeholders for each widget
//     const existingWidgetDiv = document.getElementById(widgetDivId);
//     if (!existingWidgetDiv) {
//         // If the element doesnt exists, create a placeholder for it
//         const placeholder = document.createElement('div');
//         placeholder.id = `placeholder-${widgetDivId}`;
//         placeholder.className = 'widget-placeholder'; // A CSS class to style the placeholder if needed
//         document.getElementById(containerId).appendChild(placeholder);
//     }
// }


function createCanvasElement(widgetDivId, idprefix=false) {
    // Function to generate a new canvas element with a specified id
    var existingWidgetDiv = document.getElementById(widgetDivId);
    let widgetPinned = 'pinned';
    if (!existingWidgetDiv) {
        // 1. Create the main div
        existingWidgetDiv = document.createElement('li');
        existingWidgetDiv.className = 'widget';

        // widgetDiv.classList.toggle('pinned');
        if (idprefix) {
            widgetPinned = 'unpinned';
        }

        existingWidgetDiv.id = widgetDivId;
    }
    existingWidgetDiv.style.removeProperty('display');
    var canvasChild = existingWidgetDiv.querySelector(':scope > canvas');
    if (canvasChild) {
        // If the element already exists, return it
        return existingWidgetDiv;
    } else {
        existingWidgetDiv.innerHTML = '';
    }

    // 2. Create and append the canvas element
    const canvas = document.createElement('canvas');
    canvas.id = `chart${widgetDivId}`;
    canvas.className = 'chart';
    canvas.innerText = `Widget ${widgetDivId}`;
    existingWidgetDiv.appendChild(canvas);

    // 3. Create icon-container div and set its innerHTML
    const iconContainer = document.createElement('div');
    iconContainer.className = 'icon-container';

    
    // Set the innerHTML of the iconContainer to the SVGs
    // if(chartType !== populateNextReports){
    iconContainer.innerHTML = `
          <div class="enlarge-icon" onclick="showPopup('${widgetDivId}')">
              <svg xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path fill="#17161c" d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/></svg>
            </div>`;
    // }
    iconContainer.innerHTML += `
    <div class="icon">
          <svg onclick="togglePin(this, '${widgetDivId}')" class="pinnedSVG" xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3H32c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64H64C46.3 64 32 49.7 32 32zM160 384h64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V384z"/></svg>
        </div>`
    // iconContainer.innerHTML += `
    //       <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 122.879 122.867" enable-background="new 0 0 122.879 122.867" xml:space="preserve"><g>
    //         <path onclick="togglePin(this, '${widgetDivId}')" class="pin ${widgetPinned}" fill-rule="evenodd" clip-rule="evenodd" d="M83.88,0.451L122.427,39c0.603,0.601,0.603,1.585,0,2.188l-13.128,13.125 c-0.602,0.604-1.586,0.604-2.187,0l-3.732-3.73l-17.303,17.3c3.882,14.621,0.095,30.857-11.37,42.32 c-0.266,0.268-0.535,0.529-0.808,0.787c-1.004,0.955-0.843,0.949-1.813-0.021L47.597,86.48L0,122.867l36.399-47.584L11.874,50.76 c-0.978-0.98-0.896-0.826,0.066-1.837c0.24-0.251,0.485-0.503,0.734-0.753C24.137,36.707,40.376,32.917,54.996,36.8l17.301-17.3 l-3.733-3.732c-0.601-0.601-0.601-1.585,0-2.188L81.691,0.451C82.295-0.15,83.279-0.15,83.88,0.451L83.88,0.451z"/></g></svg>`;
    if(idprefix) {
        iconContainer.innerHTML += `<div class="chartSelector" onclick="changeChart(this, '${widgetDivId}')"><svg version="1.1" height="2rem" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 120.5" style="enable-background:new 0 0 122.88 120.5" xml:space="preserve"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g>
                                    <path fill="#17161c" class="st0" d="M64.82,68.27l48.4,0.8c0,17.19-8.55,33.26-22.81,42.86L64.82,68.27L64.82,68.27z M59.99,59.92L59.44,3.63 L59.41,0l3.61,0.25h0.01h0.01c4.56,0.32,8.98,1.12,13.21,2.33c4.23,1.21,8.29,2.86,12.13,4.87c19.67,10.34,33.27,30.56,34.34,54.02 l0.16,3.61l-3.61-0.11l-56.02-1.72l-3.23-0.1L59.99,59.92L59.99,59.92z M66.19,7.33l0.48,49.31l49.06,1.5 c-2.1-19.45-13.88-36.02-30.48-44.74c-3.41-1.79-7.04-3.26-10.84-4.35C71.74,8.28,69,7.71,66.19,7.33L66.19,7.33z M55.19,65.31 l27.6,47.8c-8.38,4.84-17.92,7.39-27.6,7.39C24.71,120.5,0,95.78,0,65.31c0-29.57,23.31-53.9,52.86-55.14L55.19,65.31L55.19,65.31z"/></g></svg></div>`;
    }
    // 4. Append the icon-container to the main widget div
    existingWidgetDiv.appendChild(iconContainer);
    existingWidgetDiv.className = "ui-state-default widget";
    return existingWidgetDiv;
}

var temp = null;
function createEmptyChartDraw(chartTag, bigmode=false) {
    console.log(`Creating empty chart for ${chartTag}`);
    var ctx = document.getElementById(chartTag).getContext('2d');
    console.log(ctx);
    temp = ctx;
    var myChart = new Chart(ctx, {
        type: 'bar', // or 'line', 'pie', etc.
        data: {
            labels: [], // No labels for an empty chart
            datasets: [{
                label: 'No Data',
                data: [], // Empty data array
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    display: true, // This will display the Y-axis
                    title: {
                        display: true,
                        text: 'Value' // Title for the Y-axis
                    }
                },
                x: {
                    beginAtZero: true,
                    display: true, // This will display the X-axis
                    title: {
                        display: true,
                        text: 'Category' // Title for the X-axis
                    },
                ticks: {
                    callback: function(val, index) {
                        const maxLength = 20; // Maximum label length
                        const value = this.getLabelForValue(val);
                        if (!bigmode && value.length > maxLength) {
                            const prefix = value.substring(0, 7); // Beginning part of the label
                            const suffix = value.substring(value.length - 7, value.length); // End part of the label
                            return `${prefix}...${suffix}`; // Concatenate with ellipsis
                        }
                        return value; // Return the original label if it's short enough
                    }
                }
              }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Your Chart Title Here', // Your title text
                    font: {
                        size: 18 // You can set the title font size here
                    },
                    padding: {
                        top: 10,
                        bottom: 30 // Optional padding around the title
                    }
                }
            },
            responsive: true
        }
    });
    return myChart;
  }

async function getData(chart, emptyChart, widgetDivId) {
    try {
        chart['filters'] = filterData;
        var data = await unifiedSendRequest(GETCHARTDATA, {formData: JSON.stringify(chart), headerArgs: {'Content-Type': 'application/json'}});
        console.log(data);
        return {
            widgetDivId: widgetDivId,
            chart: chart,
            error: null,
            data: data,
            emptyChart: emptyChart
        }
    } catch(error){
        console.error(`Failed to get data, received error ${error}`);
        return {
            widgetDivId: widgetDivId,
            error: errorMessage(widgetDivId, error.message),
            data: null,
            chart: chart,
            emptyChart: emptyChart
        };
    }
}

async function fillPlaceholder(result) {
    var canvas = createCanvasElement(result.widgetDivId);
    var placeholder = document.getElementById(`placeholder-${result.widgetDivId}`);
    const existingWidgetDiv = document.getElementById(result.widgetDivId);
    if (!placeholder && existingWidgetDiv){
        placeholder = existingWidgetDiv;
    }
    if (placeholder && canvas) {
        placeholder.replaceWith(canvas);
        console.log("Drawing chart");
        var chartDrawn = await drawComponentWrapper(result);
        if (!chartDrawn) {
            canvas.style.display = 'none';
        }
    } else if (placeholder && result.error) {
        console.error('Found error');
        placeholder.replaceWith(result.error);
    }
}

function drawComponentWrapper(result) {
    if (result.data && (Object.keys(result.data).length > 0 || data.length > 0)) {
        // if (requestData.nocanvas) {
        //     return result.chartType(data);
        // } else {
        widgetChartParams[result.widgetDivId] = result;
            // if(requestData.chartType === populateNextReports){
            //     const div = document.createElement('div');
            //     div.id = `${idprefix}chart${widgetId}`;
            //     document.getElementById(`${idprefix}widget${widgetId}`).replaceChild(div, document.getElementById(`${idprefix}chart${widgetId}`));
            //     return populateNextReports(`${idprefix}chart${widgetId}`, data);
            // }
        drawChart(result);
        return true;
        // return drawComponent(result.data, `chart${result.widgetDivId}`, result.chartType, columnNames, chartTitle);
        // }
    }
    return false;
}

async function drawChart(result, useChartCanvas=false, bigmode=false) {
    var chartCanvas = result.emptyChart;
    if (useChartCanvas) {
        console.log(`Using chart ${useChartCanvas}`);
        chartCanvas = useChartCanvas;
    }
    updateChartNew(result.data, chartCanvas, false, bigmode, result.chart.title);
    console.log(`Setting chart type to ${result.chart.chart_type}`);
    chartTypesNew[result.chart.chart_type](chartCanvas);
}


async function getReportsDue(widgetDivId) {
    try {
        var data = await unifiedSendRequest(NEXTREPORTS, {method: 'GET'});
        console.log(data);
        return data;
    } catch(error){
        console.error(`Failed to get data, received error ${error}`);
        return errorMessage(widgetDivId, error.message);
    }
}

function createReportsDueWidget(results) {
    // 1. Create the main div
    const mainDiv = document.createElement('div');
    mainDiv.id = 'widgetAlwaysFirst';
    mainDiv.className = 'widget';
    mainDiv.style.fontWeight = 'bold';
    mainDiv.textContent = 'Reports due';

    // 2. Create and append the inner div
    const innerDiv = document.createElement('div');
    innerDiv.className = 'chart';
    innerDiv.id = 'nextReportsChart';
    mainDiv.appendChild(innerDiv);
    populateNextReports(results);
    return mainDiv;
}


// async function drawComponent(data, chartTag, chartType, columnNames, chartTitle, big=false) {
//     const container = document.getElementById(chartTag);
//     const style = window.getComputedStyle(container);
//     console.log(style.width);
//     const containerWidth = parseInt(style.width);
//     const containerHeight = parseInt(style.height);
//     container.style.width = '100%';
//     if (big) {
//         container.style.width = '100%';
//         container.height = containerHeight;
//     }
//     container.innerHTML = ""; // empty the container

//     // var chart = initChart("#"+chartTag, containerWidth, containerHeight);
//     // chartType(chart, data, columnNames, chartTitle, "#"+chartTag);
//     var ctx = document.querySelector("#" + chartTag);
//     return chartType(ctx, data, columnNames, chartTitle, chartTag, big);
// }

// async function getAvailableCharts() {
//     let availableCharts = {};
//     try {
//       availableCharts = await unifiedSendRequest(GETCHARTS, {method: 'GET'});
//       for (let key in availableCharts) {
//         availableCharts[key].chartUUID = key;
//         if(!availableCharts[key].endpoint){
//             availableCharts[key].endpoint = "stats/data/";
//         }
//         availableCharts[key].chartType = chartTypes[availableCharts[key].chart_type];
//         availableCharts[key].chartTitle = availableCharts[key].title;
//         availableCharts[key].columnNames = availableCharts[key].column_name.split(',');

//         var chartFormData = new FormData();
//         if (typeof filterFormData !== 'undefined') { // Create a new FormData object (chartFormData) and append all elements from filterFormData
//           for (var pair of filterFormData.entries()) {
//             var [formKey, formValue] = pair;
//             chartFormData.append(formKey, formValue);
//           }
//         }
//         chartFormData.append('metrics', availableCharts[key].column_name);
//         chartFormData.append('axes', availableCharts[key].axes);
//         chartFormData.append('aggregation_type', availableCharts[key].aggregation);
//         availableCharts[key].requestFormData = chartFormData;
//       }
//     } catch (error) {
//       console.error(error.message);
//     }
//     return availableCharts;
// }

function pinWidget(id) {
    const widget = document.getElementById(id);
    widget.classList.toggle('pinned');
}

function togglePin(svg, id) {
    let widgetData = widgetChartParams[id];
    let chartId = widgetData.chart.id;
    const formData = new FormData();
    formData.append("chart_id", chartId);
    pinWidget(id);
    if (svg.classList.contains('pinnedSVG')) {
        svg.classList.remove('pinnedSVG');
        svg.classList.add('unpinnedSVG');
        unifiedSendRequest(DELETEPIN, { formData: formData });
        if (!id.includes('add')) {
            redraw();
        }
    } else {
        svg.classList.remove('unpinnedSVG');
        svg.classList.add('pinnedSVG');
        unifiedSendRequest(ADDPIN, { formData: formData });

    }
}
function changeChart(svg, id, idprefix){
    // Check if the dropdown menu already exists
    let dropdownMenu = document.getElementById('dropdown-menu');
    if(dropdownMenu) {
        document.body.removeChild(dropdownMenu);
    }
    // Create the dropdown menu if it doesn't exist
    dropdownMenu = document.createElement('div');
    dropdownMenu.id = 'dropdown-menu';
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.zIndex = 2001;

    // Create the list of available charts
    const ul = document.createElement('ul');
    let currentChartTypeFunc = widgetChartParams[`${idprefix}widget${id}`].chartType;
    let foundEntry = Object.entries(chartTypes).find(([key, value]) => value === currentChartTypeFunc);
    let currentChartType;
    if (foundEntry) {
        let [key, value] = foundEntry;
        currentChartType = key;
    }
    let compatibleCharts;
    if (singleIndexCharts.includes(currentChartType)){
        compatibleCharts = singleIndexCharts;
    } else if (multiIndexCharts.includes(currentChartType)) {
        compatibleCharts = multiIndexCharts;
    } else {
        compatibleCharts = [];
    }
    ul.style.listStyleType = 'none';
    chartOptions.forEach(chartType => {
        const li = document.createElement('li');
        li.textContent = chartType;
        if (chartType === currentChartType) {
            // If the chart type is the currently chosen one, make it bold and unclickable
            li.style.fontWeight = 'bold';
            li.style.cursor = 'default';
            li.style.pointerEvents = 'none';
        } else if (compatibleCharts.includes(chartType)) {
            li.style.cursor = 'pointer';
            li.onclick = () => {
                // Assuming you have a function to update the chart
                updateChart(id, chartType, idprefix);
                // Hide the dropdown menu
                dropdownMenu.classList.remove('show');
            };
        } else {
            // If the chart type is not compatible, disable the list item
            li.style.cursor = 'not-allowed';
            li.style.color = '#ccc';  // Optional: change the color to grey to indicate it's disabled
            li.style.pointerEvents = 'none';  // Disable click events on this list item
        }
        ul.appendChild(li);
    });

    dropdownMenu.appendChild(ul);
    document.body.appendChild(dropdownMenu);

    // Get the position of the SVG element and set the position of the dropdown menu
    const rect = svg.getBoundingClientRect();
    dropdownMenu.style.left = (rect.left + window.scrollX) + 'px';
    dropdownMenu.style.top = (rect.bottom + window.scrollY) + 'px';

    // Toggle the visibility of the dropdown menu
    dropdownMenu.classList.toggle('show');
    // If the dropdown menu is visible, set up a click handler to hide it when clicking outside
    if (dropdownMenu.classList.contains('show')) {
        // Use setTimeout to delay the attachment of the event listener
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    }

    function handleClickOutside(event) {
        // If the click event's target is not the dropdown menu or a descendant of the dropdown menu
        if (!dropdownMenu.contains(event.target) && event.target !== svg) {
            // Hide the dropdown menu
            dropdownMenu.classList.remove('show');
            // Remove this event listener since the dropdown menu is now hidden
            document.removeEventListener('click', handleClickOutside);
        }
    }
}

function updateChart(widgetId, chartType, idprefix) {
    var oldParams = widgetChartParams[`${idprefix}widget${widgetId}`];
    var newParams = { ...oldParams };
    newParams.chartType = chartTypes[chartType];
    // destroy old chart to reload
    let chartStatus = Chart.getChart(`${idprefix}chart${widgetId}`);
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }
    drawComponentWrapper(widgetId, newParams, newParams.data, idprefix);
    try {
        let formData = new FormData();
        formData.append('chart_id', newParams.chartUUID);
        formData.append('chart_type', chartType);
        availableCharts = unifiedSendRequest(EDITCHARTTYPE, {formData: formData});
    } catch (error) {
        console.error(error.message);
    }
}

let chartInstances = new Map(); // store the chart objects to update them with new data

function populateNextReports(data) {
    var chartTag = 'widgetReportsDue';
    const div = document.createElement('div');
    div.style.height = '100%';
    div.style.position = 'relative';

    // Create a table
    const table = document.createElement('table');
    table.style.width = '95%';
    table.style.margin = 'auto';
    table.style.marginTop = '3%';
    table.style.position = 'absolute';

    // Add a header row
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Country</th><th>Type</th><th>Deadline</th></tr>';
    table.appendChild(thead);

    // Add the data rows
    const tbody = document.createElement('tbody');
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.title = item.description;
        const tdCountry = document.createElement('td');
        tdCountry.textContent = item.country;

        const tdType = document.createElement('td');
        tdType.textContent = item.type;

        const tdDeadline = document.createElement('td');
        tdDeadline.textContent = item.deadline;

        // Check if the deadline is in the past
        const [day, month, year] = item.deadline.split('.');
        const formattedDeadline = `${month}/${day}/${year}`;
        const deadlineDate = new Date(formattedDeadline);
        const currentDate = new Date();
        if (item.done === true) {
            tdDeadline.classList.add('done-deadline');
        }
        else if (deadlineDate < currentDate) {
            tdDeadline.classList.add('past-deadline');
        }

        tr.appendChild(tdCountry);
        tr.appendChild(tdType);
        tr.appendChild(tdDeadline);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var container = document.getElementById(chartTag);
    // Insert the table into the chart div
    container.innerHTML = ""; // empty the container
    div.appendChild(table);
    container.appendChild(div);
    return true;
}




function errorMessage(widgetId, error, idprefix='') {
    var widgetDivId = `${idprefix}widget${widgetId}`;
    var errormessage = `<h3>${error}</h3>`
    const existingWidgetDiv = document.getElementById(widgetDivId);
    existingWidgetDiv.style.display = 'flex';
    existingWidgetDiv.style.justifyContent = 'center';
    existingWidgetDiv.style.alignItems = 'center';
    if (existingWidgetDiv) {
        existingWidgetDiv.innerHTML = errormessage;
    }
    const widgetDiv = document.createElement('li');
    widgetDiv.style.display = 'flex';
    widgetDiv.style.justifyContent = 'center';
    widgetDiv.style.alignItems = 'center';
    widgetDiv.className = 'widget';
    widgetDiv.id = widgetDivId;
    widgetDiv.innerHTML = errormessage;
    return widgetDiv;
}

let chartTypesNew = {
    // 'Pie Chart': drawPieChartNew,
    'Bar Chart': drawBarChartNew,
    // 'Multi Bar Chart': drawMultiBarChart,
    // 'Stacked Bar Chart': drawStackedBarChartDeprecated,
    'Line Chart': drawLineChartNew,
    'Scatter Chart': drawScatterChartNew,
    // 'populateNextReports': populateNextReports
  }

// All available chart types
let chartTypes = chartTypesNew
// {
    // 'Bar Chart': drawBarChart,
    // 'Multi Bar Chart': drawMultiBarChart,
    // 'Stacked Bar Chart': drawStackedBarChart,
    // 'Line Chart': drawLineChart,
    // 'Pie Chart': drawPieChart,
    // 'Scatter Chart': drawScatterChart,
    // 'populateNextReports': populateNextReports
//   }
let chartOptions = Object.keys(chartTypes).filter(chart => chart !== 'populateNextReports');
let singleIndexCharts = ['Bar Chart', 'Line Chart', 'Pie Chart'];
let multiIndexCharts = ['Multi Bar Chart', 'Stacked Bar Chart'];