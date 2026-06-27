document.addEventListener('DOMContentLoaded', function () {
  const cta = document.querySelector('.cta');
  if (!cta) return;

  cta.addEventListener('click', function (e) {
    e.preventDefault();
    this.classList.add('shooting');
  });

  cta.addEventListener('animationend', function () {
    if (this.classList.contains('shooting')) {
      this.classList.remove('shooting');
      this.classList.add('returning');
    } else if (this.classList.contains('returning')) {
      this.classList.remove('returning');
    }
  });
});
