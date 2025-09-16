async function editProfile() {
    const dropdown = document.getElementById("profileSelect");
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const editIcon = document.getElementById("editIcon");
  
    // Change the selected option to an input field to edit the name
    const input = document.createElement("input");
    input.value = selectedOption.text;
    input.style.width = "70%";
    input.style.marginRight = '1rem';
    const checkIcon = document.createElement("span");
    checkIcon.innerHTML = "✔";
    checkIcon.style.cursor = "pointer";
    checkIcon.style.marginRight = "5px";
    const xIcon = document.createElement("span");
    xIcon.innerHTML = "✖";
    xIcon.style.cursor = "pointer";
    xIcon.style.marginRight = "5px";
    const deleteIcon = document.createElement("span");
    deleteIcon.innerHTML = '<img width="20px" src="{{ section.settings.trashcan | image_url }}" alt="{{ section.settings.trashcan.alt | escape }}" loading="lazy">';
    deleteIcon.style.cursor = "pointer";
  
    input.addEventListener("keyup", async function(event) {
        // If "Enter" key is pressed
        if (event.key === "Enter") {
            await handleSave();
        }
    });

    checkIcon.addEventListener("click", async function() {
        await handleSave();
    });
    async function handleSave() {
        selectedOption.text = input.value;
            try {
                var profile = {
                'id': selectedOption.value,
                'name': input.value
                }
                var response = await unifiedSendRequest(PROFILERENAME, {formData: JSON.stringify(profile), headerArgs: {'Content-Type': 'application/json'}});
            } catch (error) {
                console.error(error.message);
                showMessage('Failed to rename profile ' + error.message, false);
            }
        revertToOriginalState();
    }
    xIcon.addEventListener("click", function() {
        // Revert without changes
        revertToOriginalState();
    });


    function revertToOriginalState() {
        // Remove the input field and icons, show the dropdown and editIcon
        dropdown.parentElement.removeChild(input);
        dropdown.parentElement.removeChild(checkIcon);
        dropdown.parentElement.removeChild(deleteIcon);
        dropdown.parentElement.removeChild(xIcon);
        dropdown.style.removeProperty('display');  // Remove the display style
        editIcon.style.display = "inline";
    }
  
    deleteIcon.addEventListener("click", async function() {
      const isConfirmed = confirm("Are you sure you want to delete this profile?");
      if (isConfirmed) {
          try {
              // Send request to DELETEPROFILE endpoint
              const profileIdToDelete = selectedOption.value;
              const response = await unifiedSendRequest(DELETEPROFILE + `?profile_id=${profileIdToDelete}`, {method: 'DELETE'});
  
              // Check if deletion was successful
              if (response.success) {
                  // Remove the profile from the dropdown
                  dropdown.remove(dropdown.selectedIndex);
                  revertToOriginalState();
              } else {
                  alert("Failed to delete the profile.");
              }
          } catch (error) {
              console.error(error.message);
              showMessage('Failed to delete profile ' + error.message, false);
          }
      }
    });
  
    // Hide the dropdown and editIcon, and insert the input and icons
    dropdown.style.display = "none";
    editIcon.style.display = "none";
    dropdown.parentElement.insertBefore(input, dropdown);
    dropdown.parentElement.insertBefore(checkIcon, dropdown);
    dropdown.parentElement.insertBefore(xIcon, dropdown);
    dropdown.parentElement.insertBefore(deleteIcon, dropdown);
    input.focus();
}

async function selectProfile(dropdown) {
    if (dropdown.value === "add_new") {
        try {
            // Send request to ADDPROFILE
            const profileName = `Profile ${dropdown.options.length}`;
            var profile = {
              name: profileName,
              liveData: false
            }
            var response = await unifiedSendRequest(ADDPROFILE, {formData: JSON.stringify(profile), headerArgs: {'Content-Type': 'application/json'}});
            // Remove the "add_new" option that was selected
            dropdown.remove(dropdown.selectedIndex);
            // Assume the response contains the new profile's ID
            const newProfileId = response.id;
  
            // Create a new profile option
            const newOption = document.createElement("option");
            newOption.value = newProfileId;
            newOption.text = response.name;
            dropdown.appendChild(newOption);
  
            // Re-add the "Add New Profile" option
            const addProfileOption = document.createElement("option");
            addProfileOption.value = "add_new";
            addProfileOption.text = "Add New Profile";
            dropdown.appendChild(addProfileOption);
  
            // Optionally, select the newly added profile
            newOption.selected = true;
  
        } catch (error) {
            console.error(error.message);
            showMessage('Failed to add profile ' + error.message, false);
        }
    } else {
        getProfileLabels(dropdown.value, activeTab);
    }
}

async function getProfileLabels(profile, activeTab) {
    try {
        if (activeTab == 'orders') {
        var url = GETORDERLISTLABELSV2 + `?profile=${profile}`;
        } else if (activeTab == 'returns') {
        var url = GETRETURNLISTLABELSV2 + `?profile=${profile}`;
        } else if (activeTab == 'fulfilment') {
        var url = GETFULFILMENTLABELSV2 + `?profile=${profile}`;
        }
        var labels = await unifiedSendRequest(url, {method: 'GET'});
        if (activeTab == 'fulfilment') {
            found_label = Object.entries(labels).find(item => item[1] == 'default_main_type');
            if (found_label) {
                document.getElementById('extraOptionsSelect').value = found_label[0];
            } else {
                document.getElementById('extraOptionsSelect').value = '';
            }
        }
        var profileTable = document.getElementById('profileTableBody');
        if (Object.keys(labels).length > 0) {
            profileTable.querySelectorAll('tr').forEach(row => {
                var select = row.querySelector('select');
                if (select.getAttribute('data-name') in labels) {
                    select.value = labels[select.getAttribute('data-name')];
                } else {
                    row.querySelector('input').click(); // if the column is not in the orderlist labels, then it is excluded
                }
            });
        } else {
            // new profile, so set all to unmapped
            profileTable.querySelectorAll('tr').forEach(row => {
                var select = row.querySelector('select');
                select.value = '';
                if (row.querySelector('input').checked) {
                    row.querySelector('input').click();
                }
            });
        }
    } catch (error) {
      console.error(error.message);
      showMessage('Failed to get ' + activeTab + ' list labels ' + error.message, false);
    }
}