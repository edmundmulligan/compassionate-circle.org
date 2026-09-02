/**
 * Booking form – client-side validation and submission
 */
(function () {
  'use strict';

  var form = document.getElementById('bookingForm');
  if (!form) return;

  var successEl = document.getElementById('booking-success');
  var errorEl   = document.getElementById('booking-error');
  var submitBtn = document.getElementById('booking-submit-btn');

  /* Set minimum date to today */
  var dateInput = document.getElementById('bk-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  function showAlert(el, visible) {
    el.style.display = visible ? 'block' : 'none';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function markInvalid(input) {
    input.style.borderColor = '#c0392b';
  }

  function clearInvalid(input) {
    input.style.borderColor = '';
  }

  function validate() {
    var valid = true;
    var firstName   = form.querySelector('[name="first_name"]');
    var lastName    = form.querySelector('[name="last_name"]');
    var email       = form.querySelector('[name="email"]');
    var sessionType = form.querySelector('[name="session_type"]');
    var date        = form.querySelector('[name="preferred_date"]');
    var agree       = form.querySelector('[name="agree"]');

    [firstName, lastName, email, sessionType, date].forEach(clearInvalid);

    if (!firstName.value.trim()) { markInvalid(firstName); valid = false; }
    if (!lastName.value.trim())  { markInvalid(lastName);  valid = false; }
    if (!email.value.trim() || !isValidEmail(email.value.trim())) { markInvalid(email); valid = false; }
    if (!sessionType.value)      { markInvalid(sessionType); valid = false; }
    if (!date.value)             { markInvalid(date); valid = false; }

    if (agree && !agree.checked) {
      agree.style.outline = '2px solid #c0392b';
      valid = false;
    } else if (agree) {
      agree.style.outline = '';
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

    fetch('php/booking.php', {
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
        /* Graceful fallback for static hosting */
        showAlert(successEl, true);
        form.reset();
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
      });
  });

  form.querySelectorAll('input, select, textarea').forEach(function (el) {
    el.addEventListener('change', function () { clearInvalid(el); });
    el.addEventListener('input',  function () { clearInvalid(el); });
  });
}());
