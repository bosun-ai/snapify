// var server_url = "https://api.for-sure.net:8123/";
// var websocket_url = 'ws://api.for-sure.net:8123';
// var auth_url = "http://api.for-sure.net:4534/realms/ForSURE/protocol/openid-connect/token"
// var client_secret = 'h1LqoPGk9EcCugp1I31JLYU16lJrYku5';

// local:
var server_url = 'http://127.0.0.1:81/';
var websocket_url = 'ws://127.0.0.1:81';
var auth_url = 'http://127.0.0.1:8080/realms/ForSURE/protocol/openid-connect/token'
var client_secret = '40GYEkrGXYwijzE3A1LypMFo1UI6R7DR';

var TOKEN = false;
var username = "test";
var password = "test";


async function login(id, key) {
  username = id;
  password = key;
  data = await requestToken();
  TOKEN = data["access_token"];
}

async function requestToken() {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  formData.append("grant_type", "password");
  formData.append("client_id", "Shopify");
  formData.append("client_secret", client_secret);
  const response = await fetch(auth_url, {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    return await response.json();
  } else {
    const errorMessage = await response.text();
    throw new Error(`Failed to request token: ${errorMessage}`);
  }
}

async function unifiedSendRequest(endpoint, options = {}) {
  const {formData = false, method = 'POST', headerArgs = false} = options;
  let response;
  for(let i=0;i<3;i++){
    if (!TOKEN) {
      try {
        data = await requestToken();
        TOKEN = data["access_token"];
      } catch (error) {
        TOKEN = false;
      }
    }
    const header = {
      'Authorization': `Bearer ${TOKEN}`
    };
    if (headerArgs) {
      for (arg in headerArgs) {
        header[arg] = headerArgs[arg];
      }
    }
    if (formData) {
      response = await fetch(server_url + endpoint, {
        method: method,
        headers: header,
        body: formData
      });
    } else {
      response = await fetch(server_url + endpoint, {
        method: method,
        headers: header,
      });
    }
    if(response.status != 401) {
      break;
    }
    TOKEN = false;
 }

  if (response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      // Handle JSON response
      return await response.json();
    } else {
      // automatically download the file
      const contentDisposition = response.headers.get("content-disposition");
      let filename = 'EPR_report.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      // Handle file (blob) response
      const blob = await response.blob();
      const bloburl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = bloburl;
      a.download = filename; // the filename you want
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(bloburl);
    }
  } else {
    const errorMessage = await response.json();
    const errorDetails = errorMessage["detail"];
    if (errorDetails === '') {
      errorDetails = await response.text();
    }
    throw new Error(errorDetails);
  }
}


async function unifiedSendRequestBlob(endpoint, options = {}) {
  const {formData = false, method = 'POST', headerArgs = false} = options;
  let response;
  for(let i=0;i<3;i++){
    if (!TOKEN) {
      try {
        data = await requestToken();
        TOKEN = data["access_token"];
      } catch (error) {
        console.error(error.message);
        TOKEN = false;
      }
    }
    const header = {
      'Authorization': `Bearer ${TOKEN}`
    };
    if (headerArgs) {
      for (arg in headerArgs) {
        header[arg] = headerArgs[arg];
      }
    }
    if (formData) {
      response = await fetch(server_url + endpoint, {
        method: method,
        headers: header,
        body: formData
      });
    } else {
      response = await fetch(server_url + endpoint, {
        method: method,
        headers: header,
      });
    }
    if(response.status != 401) {
      break;
    }
    TOKEN = false;
 }

  if (response.ok) {
      return await response.blob();
  } else {
    const errorMessage = await response.json();
    const errorDetails = errorMessage["detail"];
    if (errorDetails === '') {
      errorDetails = await response.text();
    }
    throw new Error(errorDetails);
  }
}


function waitForPermission(callback) {
  const check = () => {
    if (
      window.userPermissions &&
      Object.keys(window.userPermissions).length > 0
    ) {
      callback();
    } else {
      setTimeout(check, 50); // Try again in 100ms
    }
  };
  check();
}
