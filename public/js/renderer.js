document.getElementById("versionMenu").addEventListener("change", setVersion);
document.getElementById("errorBtn").addEventListener("click", showLogs);
function loginMSA() {
  window.electronAPI.login();
}

function launchGame() {
  window.electronAPI.play();
}

function setVersion() {
  var dropdownMenu = document.querySelector("#versionMenu");
  let version = dropdownMenu.value;
  window.electronAPI.setVersion(version);
}


window.electronAPI.errorLog((message) => {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.innerText = errorContainer.value + "\n" + message;
})