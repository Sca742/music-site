document.addEventListener("DOMContentLoaded", () => {
  const elem = document.querySelector("video");
  const spinner = document.getElementById("spinner");

  function shuffle(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  function load() {
    if (elem) {
      const time = shuffle([60, 120, 180, 240, 300]);
      elem.currentTime = time;
    }
  }

  elem.addEventListener('canplaythrough', () => {
    spinner.style.display = 'none';
    elem.style.display = 'block';
  });

  load();
});
