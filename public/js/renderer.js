function loginMSA() {
  window.electronAPI.login();
}

function launchGame() {
  var version = setVersion();
  window.electronAPI.play(version);
  console.log(version);
}

function setVersion() {
  var dropdownMenu = document.querySelector("#versionMenu");
  let version = dropdownMenu.value;
  return version;
}