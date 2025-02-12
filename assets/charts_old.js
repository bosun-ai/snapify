var customColors = ['#2255FF', '#55FF22', '#FF2255', '#5522FF', '#FF5522'];

function initChart(tag, containerWidth=300, containerHeight=300) {
  // Access the container dimensions
  

  // set the dimensions and margins of the graph
  var margin = {top: 30, right: 30, bottom: 70, left: 60},
      width = containerWidth - margin.left - margin.right,
      height = containerHeight - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select(tag)
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  return { svg, width, height, margin };
}

function drawBarChart(chart, data, columnName, headerText) {
    var { svg, width, height, margin } = chart;

    // Convert the nested object into an array of objects
    var dataCol = Object.entries(data[columnName]).map(([key, value]) => ({ Type: key, Value: value }));

    var x = d3.scaleBand()
        .range([0, width])
        .domain(dataCol.map(function(d) { return d.Type; }))
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");
    
    var y = d3.scaleLinear()
        .domain([0, d3.max(dataCol, function(d) { return +d.Value; })])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(headerText);
    
    svg.selectAll("mybar")
        .data(dataCol)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.Type); })
        .attr("y", function(d) { return y(d.Value); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.Value); })
        .attr("fill", "#2255ff");
}
var months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function drawMultiBarChart(chart, dataObj, columnNames, headerText, tag) {
    var { svg, width, height, margin } = chart;

    // Convert the nested objects into the desired array format
    var keys = Object.keys(dataObj[columnNames[0]]);
    var data = keys.map(key => {
        var obj = { "Type": key };
        columnNames.forEach(colName => {
            obj[colName] = dataObj[colName][key];
        });
        return obj;
    });

    // Add Header
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(headerText);

    // Define the subgroups
    var subgroups = columnNames;

    // Define the groups
    var groups = data.map(function(d) { return d.Type; });

    var tooltip = d3.select(tag).append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Add X axis
    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { 
        // Find the max value for each row across all columns
        return columnNames.reduce(function(max, columnName) {
            return Math.max(max, d[columnName]);
        }, -Infinity); // Start with a very small number
    })])
    .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Another scale for subgroup positioning
    var xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    // Using custom color palette
    var color = d3.scaleOrdinal()
                  .domain(columnNames)
                  .range(customColors); // use customColors here    // Add Bars
    svg.append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
        .attr("transform", function(d) { return "translate(" + x(d.Type) + ",0)"; })
      .selectAll("rect")
      .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
      .enter().append("rect")
        .attr("x", function(d) { return xSubgroup(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", xSubgroup.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) { return color(d.key); })
        .on("mouseover", function(event, d) {
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
            tooltip.html("Key: " + d.key + "<br/>Value: " + d.value)
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });
  var legend = svg.selectAll(".legend")
    .data(columnNames) // use the columnNames as the data
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { 
        return "translate(0," + i * 20 + ")"; 
    });

    // Draw rectangles for the legend
    legend.append("rect")
        .attr("x", width - 18) // position rectangles to the right of the chart
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d) { return color(d); }); // use the same color scale as the bars
    
    // Draw text for the legend
    legend.append("text")
        .attr("x", width - 24) // position text to the left of the rectangles
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { 
            // Use only the last part of the columnName as the legend text
            var parts = d.split('.');
            var monthNumber = parseInt(parts[parts.length - 2], 10);
            return months[monthNumber]; 
        });
}

function drawLineChart(chart, dataObj, columnName, headerText) {
    var { svg, width, height, margin } = chart;

   var data = Object.entries(dataObj[columnName]).map(([key, value]) => ({ Type: key, Value: value }));

    // Add Header
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(headerText);

    // Add X axis
    var x = d3.scaleBand()
        .domain(data.map(function(d) { return d.Type; }))
        .range([0, width])
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d.Value; })])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add the line
    var line = d3.line()
        .x(function(d) { return x(d.Type) + x.bandwidth() / 2; }) // Position in the center of the band
        .y(function(d) { return y(d.Value); });

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);
}

function drawPieChart(chart, dataObj, columnName, headerText) {
    var { svg, width, height, margin } = chart;

    // Convert the nested object into an array format
    var keys = Object.keys(dataObj[columnName]);
    var data = keys.map(key => {
        return { "Type": key, "Value": dataObj[columnName][key] };
    });
    console.log(data);
    let totalValue = d3.sum(data, d => d.Value);
    console.log(totalValue);
    data = data.filter(d => d.Value / totalValue > 0.01); // Ignore data below 1%
    console.log(data);
    data.sort((a, b) => b.Value - a.Value); // Sort data by size

    var pieGroup = svg.append("g")
                      .attr("transform", "translate(" + (margin.left + width / 4) + "," + (margin.top + height / 2) + ")");


    // Add Header
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(headerText);

    // Set the color scale
    // var color = d3.scaleOrdinal(d3.schemeCategory10);
    var color = d3.scaleOrdinal()
                  .domain(data.map(d => d.Type))  // Use the sorted data here for the domain
                  .range(customColors);

    // Compute the position of each group on the pie:
    var pie = d3.pie().value(function(d) { return d.Value; });
    var data_ready = pie(data);

    // Build the pie chart
    pieGroup
        .selectAll('whatever')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - margin.top)
        )
        .attr('fill', function(d) { return color(d.data.Type); })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 1);

    // Add labels
    pieGroup
    .selectAll('textLabels')
    .data(data_ready)
    .enter()
    .append('text')
    .text(function(d) { return d.data.Type; }) // Use Type for the labels
    .attr("transform", function(d) {
        var pos = d3.arc()
                    .innerRadius(0)
                    .outerRadius(Math.min(width, height) / 2 - margin.top)
                    .centroid(d);
        // Adjust the x and y coordinates for the text label
        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = pos[0] * 1.1;  // Push out by 10% of radius for x
        pos[1] = pos[1] * 1.1;  // Push out by 10% of radius for y
        return "translate(" + pos + ")";
    })
    .style("text-anchor", function(d) {
        // Determine the anchor based on the pie slice angle
        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return (midangle < Math.PI ? "start" : "middle");
    })
    .style("font-size", 12);
}
