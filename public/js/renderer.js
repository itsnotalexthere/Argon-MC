document.getElementById("versionMenu").addEventListener("change", setVersion);
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

window.electronAPI.log((message) => {
  const errorContainer = document.getElementById("gameLog-container");
  errorContainer.innerText = errorContainer.value + "\n" + message;
})