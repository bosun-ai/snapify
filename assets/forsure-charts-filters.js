let allowedCategories = [
    "Batteries",
    "Packaging",
    'Batteries build in products',
    'Textile',
    'WEEE'
];
let filterFormData = new FormData();
// var reportChosen = false;
var filterData = {
    'country': [],
    'start_time': null,
    'end_time': null,
    'profile': [],
    'report_name': [],
    'categories': []
};

function getCountries(filters) {
    fillDropdown("countries", filters, 'country');
}

function getProfiles(filters) {
    fillDropdown("profileDropdown", filters, 'profile');
}

// function getReports(filters) {
//     fillDropdown("reportsDropdown", filters, 'report_name');
// }

// function getColumns(filters) {
//     fillDropdown("columnsDropdown", filters, 'categories');
// }

function getFilters() {
    getCountries(filterData);
    getDateOptions();
    getProfiles(filterData);
    // getReports(filterData);
    // getColumns(filterData);
}

function updateCountry() {
    const selCountries = Array
        .from(this.options)
        .filter(option => option.selected)
        .map(option => option.value);
    filterData['country'] = selCountries;
    updateCharts();
    // Update the dates, reports, and columns based on selected country
    getDateOptions(selCountries);
    getProfiles(filterData);
    // getReports(filterFormData);
    // getColumns(filterFormData);
}

// function updateDatepicker(start, end) {
//     filterData['start_time'] = start.format('YYYY-MM-DD');
//     filterData['end_time'] = end.format('YYYY-MM-DD');
//     updateCharts();
//     // Update the reports and columns based on selected date range
//     getProfiles(filterFormData);
//     // getReports(filterFormData);
//     // getColumns(filterFormData);
// }
function updateProfiles() {
    if (filterFormData.has('profile')) {
        filterFormData.delete('profile');
    }
    const selProfiles = Array
        .from(this.options)
        .filter(option => option.selected)
        .map(option => option.value);
    filterData['profile'] = selProfiles;
    updateCharts();
    // getReports(filterFormData);
    // getColumns(filterFormData);
}

function updateCharts() {
    createPlot(true);
    if (typeof redraw === 'function') {
        // check that redraw is known
        redraw();
    }
}
// function updateReports() {
//     if (filterFormData.has('report_name')) {
//         filterFormData.delete('report_name');
//     }
//     const selReports = Array
//         .from(this.options)
//         .filter(option => option.selected)
//         .map(option => option.value)
//         .join(',');
//     filterFormData.append('report_name', selReports);

//     // Update the columns based on selected report
//     getColumns(filterFormData);
// }

// function updateCategories() {
//     const selCategories = Array
//         .from(this.options)
//         .filter(option => option.selected)
//         .map(option => option.value)
//         .join(',');
//     if (filterFormData.has('stat_type')) {
//         filterFormData.delete('stat_type');
//     }
//     filterFormData.append('stat_type', selCategories);
// }

// Define a dictionary mapping widget IDs to chart function parameters
const widgetChartParams = {}
// Redraw the charts
// function addChangeEventToDropdown(dropdownId) {
//   const dropdown = document.getElementById(dropdownId);
//   dropdown.addEventListener("change", function() {
//     // if (dropdownId === "reportsDropdown") {
//     //   reportChosen = dropdown.options[dropdown.selectedIndex].text;
//     // }
//     if (typeof redraw === 'function') {
//         // check that redraw is known
//         redraw();
//     }
//   });
// }

async function initDropdowns() {
    document.getElementById('filters').style.display = 'flex';
    getFilters();
  }


  async function fillDropdown(dropdownId, filters, key) {
    try {
        const response = await unifiedSendRequest(STATSREPORTS, {formData: JSON.stringify(filters), 
            headerArgs: {'Content-Type': 'application/json'}});

        const dropdown = document.getElementById(dropdownId);

        dropdown.innerHTML = "";

        const entries = response[key];
        
        entries.sort().forEach(entry => {
            const option = document.createElement("option");
            if(key === 'profile'){
                option.value = entry['profile_id'];
                option.textContent = entry['profile_name'];
            } else {
                option.value = entry;
                option.textContent = entry;
            }
            if (filterData[key].includes(entry)) {
                option.selected = true;
            }
            dropdown.appendChild(option);
        });
        $(`#${dropdownId}`).selectpicker('refresh');
        let selectedOptions = $(`#${dropdownId}`).find('option:selected');
        let displayText = selectedOptions.map(function() {
            return $(this).text(); // or $(this).val() if you want to display the value
        }).get().join(', ');
        // Check if there is any selection, otherwise set to default text
        displayText = displayText.length > 0 ? displayText : 'Nothing selected';

        // Update the display text
        $(`#${dropdownId}`).closest('.filter-group').find('.filter-option-inner-inner').text(displayText);
    } catch (error) {
        console.error(error.message);
        TOKEN = false;
    }
}

// async function getDates() {
//     try {
//         const response = await unifiedSendRequest(STATSREPORTS, {formData: JSON.stringify(filters), 
//             headerArgs: {'Content-Type': 'application/json'}});
//         // Find min start date and max end date
//         const minDate = new Date(response.start_time);
//         const maxDate = new Date(response.end_time);
//         const startDate = new Date(maxDate);
//         startDate.setDate(startDate.getDate() - 30);
//         function tsToDate(ts) {
//             var d = new Date(ts);
//             var lang = "en-NL";
//             return d.toLocaleDateString(lang, {
//                 year: 'numeric',
//                 month: 'long',
//                 day: 'numeric'
//             });
//         }


//         $('#monthPicker').daterangepicker({
//             opens: 'center',
//             showDropdowns: true,
//             linkedCalendars: false,

//             // autoApply: true,
//             startDate: startDate,
//             endDate: maxDate,
//             minDate: minDate,
//             maxDate: maxDate,
//             locale: {
//                 format: 'DD-MM-YYYY'
//             },
//             ranges: {
//                 'This Month': [
//                     moment().startOf('month'), moment().endOf('month')
//                 ],
//                 'Last 3 Months': [
//                     moment().subtract(2, 'month').startOf('month'),
//                     moment().endOf('month')
//                 ],
//                 'Last 6 Months': [
//                     moment().subtract(5, 'month').startOf('month'),
//                     moment().endOf('month')
//                 ],
//                 'Last Year': [
//                     moment().subtract(1, 'year').startOf('year'),
//                     moment().subtract(1, 'year').endOf('year')
//                 ],
//                 'Last 2 Years': [
//                     moment().subtract(2, 'years').startOf('year'),
//                     moment().subtract(1, 'year').endOf('year')
//                 ],
//                 'Last 5 Years': [
//                     moment().subtract(5, 'years').startOf('year'),
//                     moment().subtract(1, 'year').endOf('year')
//                 ]
//             }
//         }, function (start, end, label) {
//             updateDatepicker(start, end);
//             if (typeof redraw === 'function') {
//                 // check that redraw is known
//                 redraw();
//             }
//         });

//     } catch (error) {
//         console.error(error.message);
//         TOKEN = false;
//     }
// }
