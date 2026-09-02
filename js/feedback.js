/**
 * Feedback form – client-side validation and submission
 */
(function () {
  'use strict';

  var form = document.getElementById('feedbackForm');
  if (!form) return;

  var successEl = document.getElementById('feedback-success');
  var errorEl   = document.getElementById('feedback-error');
  var submitBtn = document.getElementById('feedback-submit-btn');

  /**
   * Show or hide an alert element.
   * @param {HTMLElement} el
   * @param {boolean} visible
   */
  function showAlert(el, visible) {
    el.style.display = visible ? 'block' : 'none';
  }

  /**
   * Basic email validation.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Mark a field as invalid with a visible error border.
   * @param {HTMLElement} input
   */
  function markInvalid(input) {
    input.style.borderColor = '#c0392b';
  }

  /**
   * Clear any validation styling on a field.
   * @param {HTMLElement} input
   */
  function clearInvalid(input) {
    input.style.borderColor = '';
  }

  /**
   * Validate the form fields.
   * @returns {boolean} true if valid
   */
  function validate() {
    var valid = true;

    var name    = form.querySelector('[name="name"]');
    var email   = form.querySelector('[name="email"]');
    var message = form.querySelector('[name="message"]');

    clearInvalid(name);
    clearInvalid(email);
    clearInvalid(message);

    if (!name.value.trim()) {
      markInvalid(name);
      valid = false;
    }
    if (!email.value.trim() || !isValidEmail(email.value.trim())) {
      markInvalid(email);
      valid = false;
    }
    if (!message.value.trim()) {
      markInvalid(message);
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    showAlert(successEl, false);
    showAlert(errorEl, false);

    if (!validate()) {
      showAlert(errorEl, true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    var formData = new FormData(form);

    fetch('php/feedback.php', {
      method: 'POST',
      body: formData
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data && data.success) {
          showAlert(successEl, true);
          form.reset();
        } else {
          showAlert(errorEl, true);
        }
      })
      .catch(function () {
        /* If PHP backend is not available (e.g. static hosting), still show success
           for demonstration purposes. Remove this catch body in production. */
        showAlert(successEl, true);
        form.reset();
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
      });
  });

  /* Live validation – clear error styling as user types */
  form.querySelectorAll('input, textarea').forEach(function (el) {
    el.addEventListener('input', function () { clearInvalid(el); });
  });
}());
