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
        existingWidgetDiv.classList.add('grid-item');
        existingWidgetDiv.classList.add('ui-state-default');

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

    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'grid-title';
    titleWrapper.id = `titleWrapper${widgetDivId}`;
    const title = document.createElement('div');
    title.id = `title${widgetDivId}`;
    titleWrapper.appendChild(title);

    // 3. Create icon-container div and set its innerHTML
    const iconContainer = document.createElement('div');
    iconContainer.className = 'icon-container';

    
    // Set the innerHTML of the iconContainer to the SVGs
    // if(chartType !== populateNextReports){
    iconContainer.innerHTML = `
          <div class="enlarge-icon" onclick="showPopup('${widgetDivId}')">
              <svg xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path fill="#fafafa" d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/></svg>
            </div>`;
    // }
    iconContainer.innerHTML += `
    <div class="icon">
          <svg onclick="togglePin(this, '${widgetDivId}')" class="pinnedSVG" xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path fill="#fafafa" d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3H32c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64H64C46.3 64 32 49.7 32 32zM160 384h64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V384z"/></svg>
        </div>`
    // iconContainer.innerHTML += `
    //       <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 122.879 122.867" enable-background="new 0 0 122.879 122.867" xml:space="preserve"><g>
    //         <path onclick="togglePin(this, '${widgetDivId}')" class="pin ${widgetPinned}" fill-rule="evenodd" clip-rule="evenodd" d="M83.88,0.451L122.427,39c0.603,0.601,0.603,1.585,0,2.188l-13.128,13.125 c-0.602,0.604-1.586,0.604-2.187,0l-3.732-3.73l-17.303,17.3c3.882,14.621,0.095,30.857-11.37,42.32 c-0.266,0.268-0.535,0.529-0.808,0.787c-1.004,0.955-0.843,0.949-1.813-0.021L47.597,86.48L0,122.867l36.399-47.584L11.874,50.76 c-0.978-0.98-0.896-0.826,0.066-1.837c0.24-0.251,0.485-0.503,0.734-0.753C24.137,36.707,40.376,32.917,54.996,36.8l17.301-17.3 l-3.733-3.732c-0.601-0.601-0.601-1.585,0-2.188L81.691,0.451C82.295-0.15,83.279-0.15,83.88,0.451L83.88,0.451z"/></g></svg>`;
    if(idprefix) {
        iconContainer.innerHTML += `<div class="chartSelector" onclick="changeChart(this, '${widgetDivId}')"><svg version="1.1" height="2rem" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 120.5" style="enable-background:new 0 0 122.88 120.5" xml:space="preserve"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g>
                                    <path fill="#fafafa" class="st0" d="M64.82,68.27l48.4,0.8c0,17.19-8.55,33.26-22.81,42.86L64.82,68.27L64.82,68.27z M59.99,59.92L59.44,3.63 L59.41,0l3.61,0.25h0.01h0.01c4.56,0.32,8.98,1.12,13.21,2.33c4.23,1.21,8.29,2.86,12.13,4.87c19.67,10.34,33.27,30.56,34.34,54.02 l0.16,3.61l-3.61-0.11l-56.02-1.72l-3.23-0.1L59.99,59.92L59.99,59.92z M66.19,7.33l0.48,49.31l49.06,1.5 c-2.1-19.45-13.88-36.02-30.48-44.74c-3.41-1.79-7.04-3.26-10.84-4.35C71.74,8.28,69,7.71,66.19,7.33L66.19,7.33z M55.19,65.31 l27.6,47.8c-8.38,4.84-17.92,7.39-27.6,7.39C24.71,120.5,0,95.78,0,65.31c0-29.57,23.31-53.9,52.86-55.14L55.19,65.31L55.19,65.31z"/></g></svg></div>`;
    }
    // 4. Append the icon-container to the main widget div
    titleWrapper.appendChild(iconContainer);
    existingWidgetDiv.appendChild(titleWrapper);

    const canvas = document.createElement('canvas');
    canvas.id = `chart${widgetDivId}`;
    canvas.className = 'chart';
    canvas.innerText = `Widget ${widgetDivId}`;
    
    existingWidgetDiv.appendChild(canvas);
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
        drawChart(result, `title${result.widgetDivId}`);
        document.getElementById(`titleWrapper${result.widgetDivId}`).style.display = 'block';
        return true;
        // return drawComponent(result.data, `chart${result.widgetDivId}`, result.chartType, columnNames, chartTitle);
        // }
    }
    return false;
}

async function drawChart(result, titleId, useChartCanvas=false, bigmode=false) {
    var chartCanvas = result.emptyChart;
    if (useChartCanvas) {
        console.log(`Using chart ${useChartCanvas}`);
        chartCanvas = useChartCanvas;
    }
    updateChartNew(result.data, chartCanvas, titleId, bigmode, result.chart.title);
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
    
    var chartTag = 'widgetReportsDue';
    var container = document.getElementById(chartTag);
    // Insert the table into the chart div
    container.innerHTML = ""; // empty the container
    
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'grid-title';
    titleWrapper.style.display = 'block';
    const title = document.createElement('div');
    title.id = `titlewidgetReportsDue`;
    title.innerText = 'Deadlines';
    titleWrapper.appendChild(title);
    container.appendChild(titleWrapper);

    container.style.overflowY = 'auto';
    const div = document.createElement('div');
    div.style.height = '100%';
    div.style.position = 'relative';

    const topTrigger = document.createElement('div');
    topTrigger.className = 'top-trigger';
    topTrigger.style.height = '1px';
    div.appendChild(topTrigger);

    // const deadlinesContainer = document.createElement('div');
    // deadlinesContainer.className = 'deadlines-widget';

    // // 4. Create a list for deadlines
    const deadlinesList = document.createElement('ul');
    deadlinesList.style.listStyle = 'none';
    deadlinesList.style.padding = '1rem 1rem 0 1rem';
    deadlinesList.style.textAlign = 'left';

    console.log(results);

    let pastDeadlines = [];
    let displayedDeadlines = [];

    // // 5. Iterate over the results (deadlines data)
    results.forEach(deadline => {
        const listItem = document.createElement('li');
        listItem.id = `${deadline.country}-${deadline.type}-${deadline.deadline}`;
        listItem.title = deadline.description;
        listItem.className = 'deadline';
        const deadlineDate = new Date(deadline.deadline_timestamp);
        const currentDate = new Date();
        var className = '';
        if (deadline.done === true) {
            // listItem.classList.add('done-deadline');
            className = 'done-deadline';
        }
        else if (deadlineDate < currentDate) {
            // listItem.classList.add('past-deadline');
            className = 'past-deadline';
        }
        if (deadlineDate < currentDate) {
            listItem.style.display = 'none';
            pastDeadlines.push(listItem);
        } else {
            displayedDeadlines.push(listItem);
        }
        // listItem.style.padding = '0.5rem 0';
        // listItem.onclick = () => selectDeadline(listItem);

        // Determine category icon
        let catImg;
        if (deadline.type === 'WEEE') {
            catImg = getWEEESVG();
        } else if (deadline.type === 'Batteries') {
            catImg = getBatteriesSVG();
        } else if (deadline.type === 'Packaging') {
            catImg = getPackagingSVG();
        } else {
            catImg = ''; // Default empty if unknown category
        }

        // Create the row layout
        listItem.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="flex: 1; font-size: large;font-weight: bold; text-align: left;margin-left:3rem">${deadline.country}</div>
                <div class="typeDescription"><div style="display: flex">${catImg}<div class="reportDeadlineName">${deadline.type}</div></div></div>
                <div class="${className} rounded-deadline" style="flex: 1; text-align: right; font-size: large;font-weight: bold;">${deadline.deadline}</div>
            </div>
        `;
        deadlinesList.appendChild(listItem);
    });
    div.appendChild(deadlinesList);
    // let pastToShow = 5;
    // Detect scrolling and reveal past deadlines when scrolling up
    // container.addEventListener('scroll', function () {
    //     if (container.scrollTop === 0) {
    //         // Show past deadlines when scrolled to the top
    //         let remainingPast = pastDeadlines.filter(item => item.style.display === 'none');
    //         let nextBatch = remainingPast.slice(-pastToShow); // Show the next 5

    //         nextBatch.forEach(item => {
    //             item.style.display = 'block';
    //         });
    //     }
    // });
    function loadOlderDeadlines() {
        console.log(pastDeadlines);
        if (pastDeadlines.length === 0) return;

        const scrollYBeforeAdding = container.scrollHeight - container.scrollTop;

        // Take the next batch of past deadlines to display
        let nextBatch = pastDeadlines.splice(-5); // Show the next 5 past deadlines

        nextBatch.forEach(item => {
            item.style.display = 'block';
            deadlinesList.insertBefore(item, deadlinesList.firstChild);
        });

        // Maintain scroll position
        container.scrollTop = container.scrollHeight - scrollYBeforeAdding;
    }
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadOlderDeadlines();
        }
    }, { root: container, threshold: 0.1 });

    observer.observe(topTrigger);

    container.appendChild(div);

    return mainDiv;
}



function getWEEESVG() {
    return `
    <svg width="30px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="0 0 500 500" style="enable-background:new 0 0 500 500;" xml:space="preserve">
    <style type="text/css">
    .st0{display:none;}
    .st1{display:inline;}
    .st2{fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
    .st3{fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-miterlimit:10;}
    .st4{fill:#2255FF;}
    .st5{fill:#2255FF;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
    .st6{fill:none;}
    .st7{fill:none;stroke:#000000;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
    .st8{fill:none;stroke:#000000;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
    .st9{stroke:#000000;stroke-width:4;stroke-miterlimit:10;}
    </style>
    <g id="Calque_14" class="st0">
    </g>
    <g id="data-analytics-icon">
    </g>
    <g id="data-analytics-icon_-_copie" class="st0">
    </g>
    <g id="flats-residential-apartment-ic">
    </g>
    <g id="goods-contents-icon">
    </g>
    <g id="government_building_icon">
    </g>
    <g id="partner-handshake-icon">
    </g>
    <g id="partner-handshake-icon_-_copie">
    </g>
    <g id="Send_icon">
    </g>
    <g id="Calque_9">
    </g>
    <g id="Packaging">
    </g>
    <g id="Batterie">
    </g>
    <g id="Electronics">
    <g>
    <path class="st2" d="M146.1,291v-97.83h207.8V291c0,49.51-40.14,89.64-89.64,89.64h-28.51C186.24,380.64,146.1,340.51,146.1,291z"
    />
    <g>
    <path class="st2" d="M187.67,154.27V18.49c0-6.02,4.88-10.9,10.9-10.9h3.47c6.02,0,10.9,4.88,10.9,10.9v135.78H187.67z"/>
    <path class="st2" d="M287.06,153.14V18.49c0-6.02,4.88-10.9,10.9-10.9h3.47c6.02,0,10.9,4.88,10.9,10.9v134.65H287.06z"/>
    </g>
    <path class="st5" d="M115.04,176.12v-5.27c0-9.15,7.42-16.56,16.56-16.56h236.78c9.15,0,16.56,7.42,16.56,16.56v5.27
    c0,9.15-7.42,16.56-16.56,16.56H131.61C122.46,192.68,115.04,185.27,115.04,176.12z"/>
    <line class="st2" x1="238.95" y1="494.11" x2="239.08" y2="383.94"/>
    <line class="st2" x1="271.94" y1="494.11" x2="272.07" y2="383.94"/>
    </g>
    <polygon class="st2" points="282.39,275.45 248.85,275.59 280.03,215.42 225.39,290.48 258.93,290.34 235.83,350.84 "/>
    </g>
    <g id="Electronics_-_copie">
    </g>
    <g id="Textile">
    </g>
    <g id="Packaging2">
    </g>
    <g id="Batterie2">
    </g>
    <g id="Textile2">
    </g>
    <g id="Electronics_-_copie_2" class="st0">
    </g>
    <g id="Electronics_-_copie_3">
    </g>
    <g id="Calque_19">
    </g>
    <g id="Calque_21-test">
    </g>
    <g id="Calque_22">
    </g>
    </svg>`;
}

function getBatteriesSVG() {
    return `<svg width="30px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 500 500" style="enable-background:new 0 0 500 500;" xml:space="preserve">
        <style type="text/css">
        .st0{display:none;}
        .st1{display:inline;}
        .st2{fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
        .st3{fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-miterlimit:10;}
        .st4{display:inline;fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
        .st5{fill:#2255FF;}
        .st6{fill:#2255FF;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}

        .st7{fill:none;stroke:#000000;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:22,25,22,25,22,25;}
        .st8{fill:none;stroke:#000000;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
        .st9{stroke:#000000;stroke-width:4;stroke-miterlimit:10;}
        </style>
        <g id="Calque_14" class="st0">
        </g>
        <g id="data-analytics-icon">
        </g>
        <g id="data-analytics-icon_-_copie" class="st0">
        </g>
        <g id="flats-residential-apartment-ic">
        </g>
        <g id="goods-contents-icon">
        </g>
        <g id="government_building_icon">
        </g>
        <g id="partner-handshake-icon" class="st0">
        </g>
        <g id="partner-handshake-icon_-_copie">
        </g>
        <g id="Send_icon">
        </g>
        <g id="Calque_9">
        </g>
        <g id="Packaging">
        </g>
        <g id="Batterie">
        <path class="st5" d="M203.89,51.98c-2.21-4.28,0.25,97.41,0.25,97.41s42.27,29.92,122.68,29.93
        c94.48,0.01,119.49-35.82,119.49-35.82l-0.49-93.23c0,0-22.93,35.9-114.83,36.31S203.89,51.98,203.89,51.98z"/>
        <path class="st5" d="M246.1,469.14c-6.69-27.84-3.99-39,3.54-59.36c7.53-20.36,27.4-36.29,27.4-36.29l72.18,21.06
        c0,0-16.51,13.14-26.11,34.88c-9.6,21.74-1.54,61.43-1.54,61.43L246.1,469.14z"/>
        <g>
        <path class="st2" d="M202.76,340.43c0-90.59,0-292.84,0-292.84"/>
        <path class="st2" d="M446.02,47.02c0,0,0,313.45,0,335.21c0,16.32-30.63,30.32-74.29,36.31"/>
        <path class="st2" d="M368.3,49.3c0,6.83-19.17,12.37-42.81,12.37c-23.64,0-42.81-5.54-42.81-12.37"/>
        <path class="st2" d="M445.93,140.06c0,21.76-54.44,39.4-121.59,39.4s-121.59-17.64-121.59-39.4"/>
        <ellipse class="st2" cx="324.34" cy="46.45" rx="121.59" ry="39.4"/>
        <ellipse class="st2" cx="325.48" cy="28.18" rx="42.81" ry="12.37"/>
        <line class="st2" x1="282.62" y1="28.18" x2="282.73" y2="49.87"/>
        <line class="st2" x1="368.24" y1="27.74" x2="368.35" y2="49.43"/>
        </g>
        <g>
        <path class="st2" d="M252.82,469.19c-11.57-3.69-14.14-28.03-5.74-54.37c8.4-26.34,24.59-44.7,36.15-41.01"/>

        <ellipse transform="matrix(0.3038 -0.9527 0.9527 0.3038 -186.2469 634.8038)" class="st2" cx="341.22" cy="444.84" rx="50.06" ry="22.6"/>

        <ellipse transform="matrix(0.3038 -0.9527 0.9527 0.3038 -186.1162 635.1949)" class="st2" cx="341.56" cy="444.94" rx="17.63" ry="4.28"/>

        <ellipse transform="matrix(0.3038 -0.9527 0.9527 0.3038 -180.9776 651.7137)" class="st2" cx="355.43" cy="449.69" rx="17.63" ry="4.28"/>
        <path class="st2" d="M327.51,493.05c0,0-251.63-80.23-269.1-85.8s-24.82-31.45-16.42-57.8c8.4-26.35,29.38-43.2,46.84-37.63
        s268.64,85.66,268.64,85.66"/>
        <line class="st2" x1="359.13" y1="432.04" x2="348.08" y2="428.52"/>
        <line class="st2" x1="348.44" y1="465.63" x2="337.38" y2="462.11"/>
        </g>
        </g>
        <g id="Electronics">
        </g>
        <g id="Textile">
        </g>
        <g id="Packaging2">
        </g>
        <g id="Batterie2">
        </g>
        <g id="Textile2">
        </g>
        <g id="Electronic2">
        </g>
        <g id="Calque_19">
        </g>
        <g id="Calque_21-test">
        </g>
        <g id="Calque_22">
        </g>
        </svg>`;
}

function getPackagingSVG() {
return `<svg width="30px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 500 500" style="enable-background:new 0 0 500 500;" xml:space="preserve">
        <style type="text/css">
        .st0{display:none;}
        .st1{display:inline;}
        .st2{fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
        .st3{fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-miterlimit:10;}
        .st4{display:inline;fill:none;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
        .st5{fill:#2255FF;}
        .st6{fill:#2255FF;stroke:#000000;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}

        .st7{fill:none;stroke:#000000;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:22,25,22,25,22,25;}
        .st8{fill:none;stroke:#000000;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
        .st9{stroke:#000000;stroke-width:4;stroke-miterlimit:10;}
        </style>
        <g id="Calque_14" class="st0">
        </g>
        <g id="data-analytics-icon">
        </g>
        <g id="data-analytics-icon_-_copie" class="st0">
        </g>
        <g id="flats-residential-apartment-ic">
        </g>
        <g id="goods-contents-icon">
        </g>
        <g id="government_building_icon">
        </g>
        <g id="partner-handshake-icon" class="st0">
        </g>
        <g id="partner-handshake-icon_-_copie">
        </g>
        <g id="Send_icon">
        </g>
        <g id="Calque_9">
        </g>
        <g id="Packaging">
        <polygon class="st5" points="87.49,201.21 252.31,109.68 420.36,208 248.74,293.81 "/>
        <polyline class="st2" points="227.5,282.17 249.62,266.08 273.3,282.28 "/>
        <path class="st2" d="M422.56,286.91l0.51,84.24c0.06,10.33-5.71,19.81-14.92,24.49l-143.75,73.07c-7.68,3.9-16.76,3.95-24.48,0.12
        L97.49,398.26c-9.23-4.57-15.1-13.96-15.17-24.26l-0.65-93.66"/>
        <polygon class="st2" points="250.86,294.51 286.6,361.68 462.16,264.53 420.6,206.01 "/>
        <polygon class="st2" points="250.24,295.75 84.67,201.45 44.56,257.95 214.78,361.02 "/>
        <polyline class="st2" points="250.24,110.97 194.72,53.85 28.56,139.63 84.67,201.45 250.24,110.97 "/>
        <polyline class="st2" points="250.24,110.97 420.26,205.45 478.13,139.44 308.96,53.38 250.24,110.97 "/>
        <line class="st2" x1="250.24" y1="110.97" x2="250.24" y2="264.75"/>
        </g>
        <g id="Batterie">
        </g>
        <g id="Electronics">
        </g>
        <g id="Textile">
        </g>
        <g id="Packaging2">
        </g>
        <g id="Batterie2">
        </g>
        <g id="Textile2">
        </g>
        <g id="Electronic2">
        </g>
        <g id="Calque_19">
        </g>
        <g id="Calque_21-test">
        </g>
        <g id="Calque_22">
        </g>
        </svg>`;
}


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