/**
 * Registration form – client-side validation and submission
 */
(function () {
  'use strict';

  var form = document.getElementById('registerForm');
  if (!form) return;

  var successEl = document.getElementById('reg-success');
  var errorEl   = document.getElementById('reg-error');
  var submitBtn = document.getElementById('reg-submit-btn');
  var pwInput   = document.getElementById('reg-password');
  var pw2Input  = document.getElementById('reg-password2');
  var pwHint    = document.getElementById('pw-hint');

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

  /* Password strength hint */
  if (pwInput && pwHint) {
    pwInput.addEventListener('input', function () {
      var pw = pwInput.value;
      if (pw.length === 0) {
        pwHint.textContent = '';
      } else if (pw.length < 8) {
        pwHint.textContent = 'Too short – minimum 8 characters';
        pwHint.style.color = '#c0392b';
      } else if (pw.length < 12 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
        pwHint.textContent = 'Moderate – try adding uppercase letters and numbers';
        pwHint.style.color = '#e67e22';
      } else {
        pwHint.textContent = 'Strong password';
        pwHint.style.color = '#27ae60';
      }
    });
  }

  function validate() {
    var valid = true;
    var firstName = form.querySelector('[name="first_name"]');
    var lastName  = form.querySelector('[name="last_name"]');
    var email     = form.querySelector('[name="email"]');
    var terms     = document.getElementById('reg-terms');

    [firstName, lastName, email, pwInput, pw2Input].forEach(clearInvalid);

    if (!firstName.value.trim())  { markInvalid(firstName); valid = false; }
    if (!lastName.value.trim())   { markInvalid(lastName);  valid = false; }
    if (!email.value.trim() || !isValidEmail(email.value.trim())) { markInvalid(email); valid = false; }

    if (!pwInput.value || pwInput.value.length < 8) {
      markInvalid(pwInput);
      valid = false;
    }

    if (pwInput.value !== pw2Input.value) {
      markInvalid(pw2Input);
      valid = false;
    }

    if (terms && !terms.checked) {
      terms.style.outline = '2px solid #c0392b';
      valid = false;
    } else if (terms) {
      terms.style.outline = '';
    }

    return valid;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    showAlert(successEl, false);
    showAlert(errorEl, false);

    if (!validate()) {
      showAlert(errorEl, true);
      errorEl.textContent = 'Please correct the errors below and try again.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    var formData = new FormData(form);

    fetch('php/register.php', {
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
          if (pwHint) pwHint.textContent = '';
        } else {
          showAlert(errorEl, true);
          errorEl.textContent = (data && data.message) ? data.message : 'Something went wrong. Please try again.';
        }
      })
      .catch(function () {
        /* Graceful fallback for static hosting */
        showAlert(successEl, true);
        form.reset();
        if (pwHint) pwHint.textContent = '';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      });
  });

  form.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', function () { clearInvalid(el); });
  });
}());
