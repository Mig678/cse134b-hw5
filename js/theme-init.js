(function () {
  var STORAGE_KEY = "theme-preference";

  try {
    var preference = localStorage.getItem(STORAGE_KEY);

    if (preference === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else if (preference === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch (error) {
    // localStorage unavailable
  }
})();
