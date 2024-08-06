function loginMSA() {
  window.electronAPI.login();
}

function launchGame() {
  window.electronAPI.play(setVersion);
  console.log(version);
}

function setVersion() {
  var dropdownMenu = document.querySelector("#versionMenu");
  let version = dropdownMenu.value;
  return version;
}